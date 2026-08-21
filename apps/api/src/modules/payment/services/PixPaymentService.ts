import { randomUUID } from "crypto";
import {
  CoinTransactionSource,
  PixPaymentStatus,
} from "@prisma/client";
import { prisma } from "../../../config/db";
import { config } from "../../../config/env";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "../../../core/errors/AppError";
import { emitPaymentConfirmed } from "../../../realtime/emitter";
import { CoinService } from "../../coin/services/CoinService";
import { CoinPackageService } from "../../coin-package/services/CoinPackageService";
import { PixPaymentRepository } from "../repositories/PixPaymentRepository";
import { isMockPixPaymentId } from "./MockMercadoPagoClient";
import { isStaticPixPaymentId } from "./StaticPixGateway";
import { getStaticPixInstructionMessage } from "../staticPixConfig";
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
      Date.now() + config.STATIC_PIX_EXPIRATION_MINUTES * 60 * 1000,
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

    const instructionMessage = getStaticPixInstructionMessage();

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
      instructionMessage,
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

    const current = await this.pixPaymentRepository.findById(paymentId);
    if (!current) {
      throw new NotFoundError("Pix payment", paymentId);
    }

    return this.toStatusResponse(current);
  }

  async approvePaymentById(paymentId: number, adminId: number) {
    const payment = await this.pixPaymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError("Pix payment", paymentId);
    }

    if (payment.status === PixPaymentStatus.APPROVED) {
      const balance = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { coinBalance: true },
      });

      return {
        id: payment.id,
        status: payment.status,
        paidAt: payment.paidAt?.toISOString() ?? new Date().toISOString(),
        coinsAmount: payment.coinsAmount,
        newBalance: balance?.coinBalance ?? 0,
      };
    }

    if (
      payment.status !== PixPaymentStatus.PENDING ||
      payment.expiresAt <= new Date()
    ) {
      throw new ConflictError(
        "Only pending, non-expired Pix payments can be approved",
      );
    }

    const approved = await this.finalizeApproval(
      payment.id,
      payment.externalId,
      payment.userId,
      payment.coinsAmount,
      `admin_pix_approve_${adminId}_${payment.id}`,
    );

    const balance = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: { coinBalance: true },
    });

    return {
      id: approved.id,
      status: approved.status,
      paidAt: approved.paidAt?.toISOString() ?? new Date().toISOString(),
      coinsAmount: approved.coinsAmount,
      newBalance: balance?.coinBalance ?? 0,
    };
  }

  async confirmPayment(externalId: string) {
    const payment = await this.pixPaymentRepository.findByExternalId(externalId);

    if (!payment) {
      throw new NotFoundError("Pix payment");
    }

    if (isStaticPixPaymentId(externalId)) {
      return payment;
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

    return this.finalizeApproval(
      payment.id,
      externalId,
      payment.userId,
      payment.coinsAmount,
      `mp_payment_${externalId}`,
    );
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

  private async finalizeApproval(
    paymentId: number,
    externalId: string,
    userId: number,
    coinsAmount: number,
    coinExternalId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const lockedPayment = await tx.pixPayment.findUnique({
        where: { id: paymentId },
        include: { coinPackage: true },
      });

      if (!lockedPayment) {
        throw new NotFoundError("Pix payment", paymentId);
      }

      if (lockedPayment.status === PixPaymentStatus.APPROVED) {
        return lockedPayment;
      }

      const paidAt = new Date();

      await this.coinService.creditCoins(
        userId,
        coinsAmount,
        {
          source: CoinTransactionSource.PIX_PURCHASE,
          referenceId: lockedPayment.id,
          externalId: coinExternalId,
          description: `Pix purchase ${externalId}`,
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
        where: { id: userId },
        select: { coinBalance: true },
      });

      emitPaymentConfirmed(userId, {
        paymentId: approvedPayment.id,
        coinsAmount: approvedPayment.coinsAmount,
        newBalance: balance?.coinBalance ?? 0,
        paidAt: paidAt.toISOString(),
      });

      return approvedPayment;
    });
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
      instructionMessage: getStaticPixInstructionMessage(),
    };
  }
}
