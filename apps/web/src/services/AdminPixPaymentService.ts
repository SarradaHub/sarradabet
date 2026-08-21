import type {
  AdminPixPaymentApproveResponse,
  AdminPixPaymentListResponse,
  PixPaymentStatus,
} from "@sarradabet/types";
import type { ApiResponse } from "../core/interfaces/IService";
import { createApiClient } from "./apiClient";

class AdminPixPaymentService {
  private readonly api = createApiClient("admin/payments/pix");

  async list(params?: {
    status?: PixPaymentStatus;
    page?: number;
    limit?: number;
  }): Promise<AdminPixPaymentListResponse> {
    const response = await this.api.get<ApiResponse<AdminPixPaymentListResponse>>(
      "/",
      { params },
    );
    return response.data.data;
  }

  async approve(paymentId: number): Promise<AdminPixPaymentApproveResponse> {
    const response = await this.api.post<
      ApiResponse<AdminPixPaymentApproveResponse>
    >(`/${paymentId}/approve`);
    return response.data.data;
  }
}

export const adminPixPaymentService = new AdminPixPaymentService();
