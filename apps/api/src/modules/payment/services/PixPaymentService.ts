import { randomUUID } from "crypto";
import {
  CoinTransactionSource,
  PixPaymentStatus,
} from "@prisma/client";
import { prisma } from "../../../config/db";
import { config } from "../../../config/env";
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "../../../core/errors/AppError";
import { emitPaymentConfirmed } from "../../../realtime/emitter";
import { CoinService } from "../../coin/services/CoinService";
import { CoinPackageService } from "../../coin-package/services/CoinPackageService";
import { PixPaymentRepository } from "../repositories/PixPaymentRepository";
import { isMockPixPaymentId } from "./MockMercadoPagoClient";
import type { PixGateway } from "./PixGateway";

export class PixPaymentService {
  constructor(
    private readonly pixPaymentRepository: PixPaymentRepository,
    private readonly coinService: CoinService,
    private readonly coinPackageService: CoinPackageService,
    private readonly pixGateway: PixGateway,
  ) {}

  async createPurchase(userId: number, coinPackageId: number) {
    const coinPackage = await this.coinPackageService.getActiveById(coinPackageId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const idempotencyKey = randomUUID();
    const expiresAt = new Date(
      Date.now() + config.PIX_EXPIRATION_MINUTES * 60 * 1000,
    );

    const mpPayment = await this.pixGateway.createPixPayment({
      amountCents: coinPackage.amountCents,
      description: `${coinPackage.name} - ${coinPackage.coinsAmount} moedas`,
      externalReference: idempotencyKey,
      idempotencyKey,
      expirationDate: expiresAt,
      payerEmail: user.email,
    });

    const pixPayment = await this.pixPaymentRepository.create({
      userId,
      coinPackageId: coinPackage.id,
      amountCents: coinPackage.amountCents,
      coinsAmount: coinPackage.coinsAmount,
      externalId: mpPayment.id,
      qrCode: mpPayment.qrCode,
      qrCodeBase64: mpPayment.qrCodeBase64,
      ticketUrl: mpPayment.ticketUrl,
      expiresAt,
      idempotencyKey,
    });

    return {
      paymentId: pixPayment.id,
      externalId: pixPayment.externalId,
      qrCode: pixPayment.qrCode,
      qrCodeBase64: pixPayment.qrCodeBase64,
      copyPaste: pixPayment.qrCode,
      ticketUrl: pixPayment.ticketUrl,
      expiresAt: pixPayment.expiresAt.toISOString(),
      coinsAmount: pixPayment.coinsAmount,
      amountCents: pixPayment.amountCents,
      packageName: coinPackage.name,
      status: pixPayment.status,
      isMock: isMockPixPaymentId(pixPayment.externalId),
    };
  }

  async getPaymentStatus(userId: number, paymentId: number) {
    const payment = await this.pixPaymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError("Pix payment", paymentId);
    }

    if (payment.userId !== userId) {
      throw new ForbiddenError("You do not have access to this payment");
    }

    await this.expireIfNeeded(payment.id, payment.status, payment.expiresAt);

    let current = await this.pixPaymentRepository.findById(paymentId);
    if (!current) {
      throw new NotFoundError("Pix payment", paymentId);
    }

    if (
      current.status === PixPaymentStatus.PENDING &&
      !isMockPixPaymentId(current.externalId)
    ) {
      await this.confirmPayment(current.externalId);
      current = await this.pixPaymentRepository.findById(paymentId);
      if (!current) {
        throw new NotFoundError("Pix payment", paymentId);
      }
    }

    return this.toStatusResponse(current);
  }

  async confirmPayment(externalId: string) {
    const payment = await this.pixPaymentRepository.findByExternalId(externalId);

    if (!payment) {
      throw new NotFoundError("Pix payment");
    }

    if (
      payment.status === PixPaymentStatus.APPROVED ||
      payment.status === PixPaymentStatus.EXPIRED
    ) {
      return payment;
    }

    if (payment.expiresAt <= new Date()) {
      await this.pixPaymentRepository.updateStatus(
        payment.id,
        PixPaymentStatus.EXPIRED,
      );
      return this.pixPaymentRepository.findByExternalId(externalId);
    }

    const mpPayment = await this.pixGateway.getPayment(externalId);

    if (mpPayment.status === "cancelled") {
      await this.pixPaymentRepository.updateStatus(
        payment.id,
        PixPaymentStatus.CANCELLED,
      );
      return this.pixPaymentRepository.findByExternalId(externalId);
    }

    if (mpPayment.status === "rejected") {
      await this.pixPaymentRepository.updateStatus(
        payment.id,
        PixPaymentStatus.FAILED,
      );
      return this.pixPaymentRepository.findByExternalId(externalId);
    }

    if (mpPayment.status !== "approved") {
      return payment;
    }

    const externalTransactionId = `mp_payment_${externalId}`;

    return prisma.$transaction(async (tx) => {
      const lockedPayment = await tx.pixPayment.findUnique({
        where: { externalId },
        include: { coinPackage: true },
      });

      if (!lockedPayment) {
        throw new NotFoundError("Pix payment");
      }

      if (lockedPayment.status === PixPaymentStatus.APPROVED) {
        return lockedPayment;
      }

      const paidAt = new Date();

      await this.coinService.creditCoins(
        lockedPayment.userId,
        lockedPayment.coinsAmount,
        {
          source: CoinTransactionSource.PIX_PURCHASE,
          referenceId: lockedPayment.id,
          externalId: externalTransactionId,
          description: `Pix purchase ${lockedPayment.externalId}`,
        },
        tx,
      );

      const approvedPayment = await this.pixPaymentRepository.updateStatus(
        lockedPayment.id,
        PixPaymentStatus.APPROVED,
        paidAt,
        tx,
      );

      const balance = await tx.user.findUnique({
        where: { id: lockedPayment.userId },
        select: { coinBalance: true },
      });

      emitPaymentConfirmed(lockedPayment.userId, {
        paymentId: approvedPayment.id,
        coinsAmount: approvedPayment.coinsAmount,
        newBalance: balance?.coinBalance ?? 0,
        paidAt: paidAt.toISOString(),
      });

      return approvedPayment;
    });
  }

  async simulateMockApproval(userId: number, paymentId: number) {
    if (!config.MERCADOPAGO_MOCK_PIX) {
      throw new BadRequestError("Mock Pix approval is disabled");
    }

    const payment = await this.pixPaymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError("Pix payment", paymentId);
    }

    if (payment.userId !== userId) {
      throw new ForbiddenError("You do not have access to this payment");
    }

    if (!isMockPixPaymentId(payment.externalId)) {
      throw new BadRequestError("This payment is not a mock Pix payment");
    }

    if (payment.status !== PixPaymentStatus.PENDING) {
      return this.toStatusResponse(payment);
    }

    const approveMock = this.pixGateway.approveMockPayment;
    if (!approveMock) {
      throw new BadRequestError("Mock Pix gateway is not active");
    }

    approveMock.call(this.pixGateway, payment.externalId);
    await this.confirmPayment(payment.externalId);

    const approved = await this.pixPaymentRepository.findById(paymentId);
    if (!approved) {
      throw new NotFoundError("Pix payment", paymentId);
    }

    return this.toStatusResponse(approved);
  }

  async expirePendingPayments() {
    await this.pixPaymentRepository.expirePendingPayments(new Date());
  }

  private async expireIfNeeded(
    paymentId: number,
    status: PixPaymentStatus,
    expiresAt: Date,
  ) {
    if (status !== PixPaymentStatus.PENDING || expiresAt > new Date()) {
      return;
    }

    await this.pixPaymentRepository.updateStatus(
      paymentId,
      PixPaymentStatus.EXPIRED,
    );
  }

  private toStatusResponse(
    payment: NonNullable<Awaited<ReturnType<PixPaymentRepository["findById"]>>>,
  ) {
    return {
      id: payment.id,
      externalId: payment.externalId,
      status: payment.status,
      coinsAmount: payment.coinsAmount,
      amountCents: payment.amountCents,
      packageName: payment.coinPackage.name,
      expiresAt: payment.expiresAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      copyPaste: payment.qrCode,
      isMock: isMockPixPaymentId(payment.externalId),
    };
  }
}
