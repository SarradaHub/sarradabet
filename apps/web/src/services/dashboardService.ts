import type { UserDashboardResponse } from "@sarradabet/types";
import type { ApiResponse } from "../core/interfaces/IService";
import { createApiClient } from "./apiClient";

class DashboardService {
  private readonly usersApi = createApiClient("users");

  async getDashboard(params?: {
    page?: number;
    limit?: number;
  }): Promise<UserDashboardResponse> {
    const response = await this.usersApi.get<ApiResponse<UserDashboardResponse>>(
      "/me/dashboard",
      { params },
    );
    return response.data.data;
  }
}

export const dashboardService = new DashboardService();
