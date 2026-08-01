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
import { getMercadoPagoInstoreRuntimeConfig } from "../instoreConfig";
import { PixPaymentRepository } from "../repositories/PixPaymentRepository";
import type { InstoreOrderGateway } from "./InstoreOrderGateway";
import {
  isInstoreOrderId,
  isMockInstoreOrderId,
} from "./InstoreOrderGateway";

export class InstorePaymentService {
  constructor(
    private readonly pixPaymentRepository: PixPaymentRepository,
    private readonly coinService: CoinService,
    private readonly coinPackageService: CoinPackageService,
    private readonly instoreGateway: InstoreOrderGateway,
  ) {}

  async createPurchase(userId: number, coinPackageId: number) {
    const coinPackage = await this.coinPackageService.getActiveById(coinPackageId);
    const posExternalId = config.MERCADOPAGO_MOCK_PIX
      ? config.MERCADOPAGO_POS_EXTERNAL_ID
      : getMercadoPagoInstoreRuntimeConfig().posExternalId;
    const idempotencyKey = randomUUID();
    const expiresAt = new Date(
      Date.now() + config.PIX_EXPIRATION_MINUTES * 60 * 1000,
    );

    const mpOrder = await this.instoreGateway.createOrder({
      amountCents: coinPackage.amountCents,
      description: `${coinPackage.name} - ${coinPackage.coinsAmount} moedas (presencial)`,
      externalReference: idempotencyKey,
      idempotencyKey,
      posExternalId: posExternalId,
    });

    const externalId = this.normalizeExternalId(mpOrder.id);
    let qrCodeBase64 = mpOrder.qrCodeBase64;

    if (mpOrder.qrCode && !qrCodeBase64) {
      const QRCode = await import("qrcode");
      qrCodeBase64 = (
        await QRCode.toBuffer(mpOrder.qrCode, {
          type: "png",
          width: 256,
          margin: 1,
        })
      ).toString("base64");
    }

    const pixPayment = await this.pixPaymentRepository.create({
      userId,
      coinPackageId: coinPackage.id,
      amountCents: coinPackage.amountCents,
      coinsAmount: coinPackage.coinsAmount,
      externalId,
      qrCode: mpOrder.qrCode,
      qrCodeBase64,
      ticketUrl: null,
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
      channel: "instore" as const,
      isMock: isMockInstoreOrderId(externalId),
    };
  }

  async getPaymentStatus(userId: number, paymentId: number) {
    const payment = await this.pixPaymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError("Instore payment", paymentId);
    }

    if (payment.userId !== userId) {
      throw new ForbiddenError("You do not have access to this payment");
    }

    if (!isInstoreOrderId(payment.externalId)) {
      throw new BadRequestError("This payment is not an instore order");
    }

    await this.expireIfNeeded(payment.id, payment.status, payment.expiresAt);

    let current = await this.pixPaymentRepository.findById(paymentId);
    if (!current) {
      throw new NotFoundError("Instore payment", paymentId);
    }

    if (
      current.status === PixPaymentStatus.PENDING &&
      !isMockInstoreOrderId(current.externalId)
    ) {
      await this.confirmOrder(current.externalId);
      current = await this.pixPaymentRepository.findById(paymentId);
      if (!current) {
        throw new NotFoundError("Instore payment", paymentId);
      }
    }

    return this.toStatusResponse(current);
  }

  async confirmOrder(externalId: string) {
    if (!isInstoreOrderId(externalId)) {
      throw new BadRequestError("Invalid instore order id");
    }

    const payment = await this.pixPaymentRepository.findByExternalId(externalId);

    if (!payment) {
      throw new NotFoundError("Instore payment");
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

    const mpOrderId = this.resolveGatewayOrderId(externalId);
    const mpOrder = await this.instoreGateway.getOrder(mpOrderId);
    const normalizedStatus = this.mapOrderStatus(mpOrder.status);

    if (normalizedStatus === "cancelled") {
      await this.pixPaymentRepository.updateStatus(
        payment.id,
        PixPaymentStatus.CANCELLED,
      );
      return this.pixPaymentRepository.findByExternalId(externalId);
    }

    if (normalizedStatus === "rejected") {
      await this.pixPaymentRepository.updateStatus(
        payment.id,
        PixPaymentStatus.FAILED,
      );
      return this.pixPaymentRepository.findByExternalId(externalId);
    }

    if (normalizedStatus !== "approved") {
      return payment;
    }

    const externalTransactionId = `mp_instore_${externalId}`;

    return prisma.$transaction(async (tx) => {
      const lockedPayment = await tx.pixPayment.findUnique({
        where: { externalId },
        include: { coinPackage: true },
      });

      if (!lockedPayment) {
        throw new NotFoundError("Instore payment");
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
          description: `Pix presencial ${lockedPayment.externalId}`,
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
      throw new BadRequestError("Mock instore approval is disabled");
    }

    const payment = await this.pixPaymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError("Instore payment", paymentId);
    }

    if (payment.userId !== userId) {
      throw new ForbiddenError("You do not have access to this payment");
    }

    if (!isMockInstoreOrderId(payment.externalId)) {
      throw new BadRequestError("This payment is not a mock instore order");
    }

    if (payment.status !== PixPaymentStatus.PENDING) {
      return this.toStatusResponse(payment);
    }

    const approveMock = this.instoreGateway.approveMockOrder;
    if (!approveMock) {
      throw new BadRequestError("Mock instore gateway is not active");
    }

    approveMock.call(this.instoreGateway, this.resolveGatewayOrderId(payment.externalId));
    await this.confirmOrder(payment.externalId);

    const approved = await this.pixPaymentRepository.findById(paymentId);
    if (!approved) {
      throw new NotFoundError("Instore payment", paymentId);
    }

    return this.toStatusResponse(approved);
  }

  private normalizeExternalId(orderId: string): string {
    if (isInstoreOrderId(orderId)) {
      return orderId;
    }

    return `instore_${orderId}`;
  }

  private resolveGatewayOrderId(externalId: string): string {
    if (externalId.startsWith("instore_mock_")) {
      return externalId;
    }

    return externalId.replace(/^instore_/, "");
  }

  private mapOrderStatus(status: string): "approved" | "cancelled" | "rejected" | "pending" {
    const normalized = status.toLowerCase();

    if (["processed", "paid", "approved"].includes(normalized)) {
      return "approved";
    }

    if (["cancelled", "canceled", "expired"].includes(normalized)) {
      return "cancelled";
    }

    if (["rejected", "failed"].includes(normalized)) {
      return "rejected";
    }

    return "pending";
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
      channel: "instore" as const,
      isMock: isMockInstoreOrderId(payment.externalId),
    };
  }
}

export function resolveInstoreWebhookExternalId(
  rawOrderId: string,
): string {
  return rawOrderId.startsWith("instore_") ? rawOrderId : `instore_${rawOrderId}`;
}
