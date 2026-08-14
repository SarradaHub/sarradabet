import type { AdjustCoinsRequest, AdjustCoinsResponse } from "@sarradabet/types";
import type { ApiResponse } from "../core/interfaces/IService";
import { createApiClient } from "./apiClient";

class AdminUserService {
  private readonly api = createApiClient("admin/users");

  async adjustCoins(
    userId: number,
    data: AdjustCoinsRequest,
  ): Promise<AdjustCoinsResponse> {
    const response = await this.api.post<ApiResponse<AdjustCoinsResponse>>(
      `/${userId}/coins/adjust`,
      data,
    );
    return response.data.data;
  }
}

export const adminUserService = new AdminUserService();
