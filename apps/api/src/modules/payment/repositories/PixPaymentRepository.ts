import { PixPaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../config/db";

export interface CreatePixPaymentData {
  userId: number;
  coinPackageId: number;
  amountCents: number;
  coinsAmount: number;
  externalId: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  expiresAt: Date;
  idempotencyKey: string;
}

export class PixPaymentRepository {
  async create(data: CreatePixPaymentData) {
    return prisma.pixPayment.create({ data });
  }

  async findById(id: number) {
    return prisma.pixPayment.findUnique({
      where: { id },
      include: { coinPackage: true },
    });
  }

  async findByExternalId(externalId: string) {
    return prisma.pixPayment.findUnique({
      where: { externalId },
      include: { coinPackage: true },
    });
  }

  async updateStatus(
    id: number,
    status: PixPaymentStatus,
    paidAt?: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;
    return client.pixPayment.update({
      where: { id },
      data: {
        status,
        ...(paidAt ? { paidAt } : {}),
      },
      include: { coinPackage: true },
    });
  }

  async expirePendingPayments(before: Date) {
    return prisma.pixPayment.updateMany({
      where: {
        status: PixPaymentStatus.PENDING,
        expiresAt: { lt: before },
      },
      data: { status: PixPaymentStatus.EXPIRED },
    });
  }

  async findPendingExpired(before: Date) {
    return prisma.pixPayment.findMany({
      where: {
        status: PixPaymentStatus.PENDING,
        expiresAt: { lt: before },
      },
    });
  }
}
