import type {
  AdminPixPaymentApproveResponse,
  AdminPixPaymentListResponse,
  PixPaymentStatus,
} from "@sarradabet/types";
import { prisma } from "../../../config/db";
import { NotFoundError } from "../../../core/errors/AppError";
import { AdminAuditLogRepository } from "../repositories/AdminAuditLogRepository";
import { PixPaymentRepository } from "../../payment/repositories/PixPaymentRepository";
import { PixPaymentService } from "../../payment/services/PixPaymentService";

export class AdminPixPaymentService {
  constructor(
    private readonly pixPaymentRepository: PixPaymentRepository = new PixPaymentRepository(),
    private readonly pixPaymentService: PixPaymentService,
    private readonly auditRepo: AdminAuditLogRepository = new AdminAuditLogRepository(),
  ) {}

  async listPayments(options: {
    status?: PixPaymentStatus;
    page: number;
    limit: number;
  }): Promise<AdminPixPaymentListResponse> {
    const { items, total } = await this.pixPaymentRepository.listAdminPayments(
      options,
    );

    const totalPages = Math.max(1, Math.ceil(total / options.limit));

    return {
      items: items.map((payment) => ({
        id: payment.id,
        status: payment.status,
        amountCents: payment.amountCents,
        coinsAmount: payment.coinsAmount,
        packageName: payment.coinPackage.name,
        createdAt: payment.createdAt.toISOString(),
        expiresAt: payment.expiresAt.toISOString(),
        paidAt: payment.paidAt?.toISOString() ?? null,
        user: {
          id: payment.user.id,
          username: payment.user.username,
          email: payment.user.email,
        },
      })),
      page: options.page,
      limit: options.limit,
      total,
      totalPages,
    };
  }

  async approvePayment(
    adminId: number,
    paymentId: number,
  ): Promise<AdminPixPaymentApproveResponse> {
    const payment = await this.pixPaymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError("Pix payment", paymentId);
    }

    const wasPending = payment.status === "PENDING";

    const result = await this.pixPaymentService.approvePaymentById(
      paymentId,
      adminId,
    );

    if (wasPending) {
      await prisma.$transaction(async (tx) => {
        await this.auditRepo.create(tx, {
          adminId,
          action: "PIX_APPROVE",
          targetUserId: payment.userId,
          payload: {
            paymentId,
            amountCents: payment.amountCents,
            coinsAmount: payment.coinsAmount,
            externalId: payment.externalId,
          },
        });
      });
    }

    return result;
  }
}
