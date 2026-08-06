import { NotFoundError } from "../../../core/errors/AppError";
import {
  isMockPixPayment,
  PixPaymentRepository,
  PixPaymentWithRelations,
  resolvePixPaymentChannel,
} from "../repositories/PixPaymentRepository";
import { InstorePaymentService } from "./InstorePaymentService";

export interface AdminPaymentListParams {
  page: number;
  limit: number;
  status?: "PENDING" | "APPROVED" | "EXPIRED" | "CANCELLED" | "FAILED";
  channel?: "online" | "instore";
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export class AdminPaymentService {
  constructor(
    private readonly pixPaymentRepository: PixPaymentRepository,
    private readonly instorePaymentService: InstorePaymentService,
  ) {}

  async createInstorePurchase(userId: number, coinPackageId: number) {
    return this.instorePaymentService.createPurchase(userId, coinPackageId);
  }

  async simulateMockInstoreApproval(paymentId: number) {
    const payment = await this.pixPaymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError("Instore payment", paymentId);
    }

    return this.instorePaymentService.simulateMockApproval(
      payment.userId,
      paymentId,
    );
  }

  async listPayments(params: AdminPaymentListParams) {
    const startDate = params.startDate
      ? new Date(`${params.startDate}T00:00:00.000Z`)
      : undefined;
    const endDate = params.endDate
      ? new Date(`${params.endDate}T23:59:59.999Z`)
      : undefined;

    const { items, total } = await this.pixPaymentRepository.findManyForAdmin({
      page: params.page,
      limit: params.limit,
      status: params.status,
      channel: params.channel,
      userId: params.userId,
      startDate,
      endDate,
    });

    const totalPages = Math.max(1, Math.ceil(total / params.limit));

    return {
      items: items.map((payment) => this.toListItem(payment)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
    };
  }

  async getPaymentDetail(paymentId: number) {
    const payment = await this.pixPaymentRepository.findByIdWithUser(paymentId);

    if (!payment) {
      throw new NotFoundError("Payment", paymentId);
    }

    return this.toDetail(payment);
  }

  private toListItem(payment: PixPaymentWithRelations) {
    const channel = resolvePixPaymentChannel(payment.externalId);

    return {
      id: payment.id,
      userId: payment.userId,
      username: payment.user.username,
      email: payment.user.email,
      amountCents: payment.amountCents,
      coinsAmount: payment.coinsAmount,
      status: payment.status,
      channel,
      packageName: payment.coinPackage.name,
      expiresAt: payment.expiresAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      isMock: isMockPixPayment(payment.externalId),
    };
  }

  private toDetail(payment: PixPaymentWithRelations) {
    return {
      ...this.toListItem(payment),
      externalId: payment.externalId,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      copyPaste: payment.qrCode,
      ticketUrl: payment.ticketUrl,
    };
  }
}
