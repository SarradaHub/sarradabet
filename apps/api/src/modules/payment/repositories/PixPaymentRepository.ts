import { PixPaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../config/db";
import { isInstoreOrderId, isMockInstoreOrderId } from "../services/InstoreOrderGateway";

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

export interface AdminPixPaymentFilters {
  page: number;
  limit: number;
  status?: PixPaymentStatus;
  channel?: "online" | "instore";
  userId?: number;
  startDate?: Date;
  endDate?: Date;
}

export type PixPaymentWithRelations = Prisma.PixPaymentGetPayload<{
  include: {
    coinPackage: true;
    user: {
      select: {
        id: true;
        username: true;
        email: true;
      };
    };
  };
}>;

function buildChannelWhere(
  channel?: "online" | "instore",
): Prisma.PixPaymentWhereInput | undefined {
  if (channel === "instore") {
    return { externalId: { startsWith: "instore_" } };
  }

  if (channel === "online") {
    return { NOT: { externalId: { startsWith: "instore_" } } };
  }

  return undefined;
}

export function resolvePixPaymentChannel(externalId: string): "online" | "instore" {
  return isInstoreOrderId(externalId) ? "instore" : "online";
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

  async findByIdWithUser(id: number) {
    return prisma.pixPayment.findUnique({
      where: { id },
      include: {
        coinPackage: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
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

  async findManyForAdmin(filters: AdminPixPaymentFilters) {
    const where: Prisma.PixPaymentWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
      ...(buildChannelWhere(filters.channel) ?? {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await Promise.all([
      prisma.pixPayment.findMany({
        where,
        include: {
          coinPackage: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
      }),
      prisma.pixPayment.count({ where }),
    ]);

    return { items, total };
  }
}

export function isMockPixPayment(externalId: string): boolean {
  return isMockInstoreOrderId(externalId) || externalId.startsWith("mock_");
}
