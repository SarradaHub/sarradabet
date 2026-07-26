import type {
  CreateRewardDto,
  RedeemRewardResponse,
  Reward,
  UpdateRewardDto,
  UserRewardRedemption,
  ValidateTicketResponse,
} from "@sarradabet/types";
import type { ApiResponse } from "../core/interfaces/IService";
import { createApiClient } from "./apiClient";

class RewardService {
  private readonly api = createApiClient("rewards");

  async listActive(): Promise<Reward[]> {
    const response = await this.api.get<ApiResponse<Reward[]>>("/");
    return response.data.data;
  }

  async redeem(rewardId: number): Promise<RedeemRewardResponse> {
    const response = await this.api.post<ApiResponse<RedeemRewardResponse>>(
      `/${rewardId}/redeem`,
    );
    return response.data.data;
  }

  async getMyPendingRedemptions(): Promise<UserRewardRedemption[]> {
    const response = await createApiClient("users").get<
      ApiResponse<UserRewardRedemption[]>
    >("/me/redemptions");
    return response.data.data;
  }

  async getMyValidatedRedemptions(): Promise<UserRewardRedemption[]> {
    const response = await createApiClient("users").get<
      ApiResponse<UserRewardRedemption[]>
    >("/me/redemptions/validated");
    return response.data.data;
  }
}

class AdminRewardService {
  private readonly api = createApiClient("admin/rewards");

  async listAll(): Promise<Reward[]> {
    const response = await this.api.get<ApiResponse<Reward[]>>("/");
    return response.data.data;
  }

  async create(data: CreateRewardDto): Promise<Reward> {
    const response = await this.api.post<ApiResponse<Reward>>("/", data);
    return response.data.data;
  }

  async update(id: number, data: UpdateRewardDto): Promise<Reward> {
    const response = await this.api.put<ApiResponse<Reward>>(`/${id}`, data);
    return response.data.data;
  }

  async deactivate(id: number): Promise<Reward> {
    const response = await this.api.delete<ApiResponse<Reward>>(`/${id}`);
    return response.data.data;
  }

  async validateTicket(ticketCode: string): Promise<ValidateTicketResponse> {
    const response = await this.api.post<ApiResponse<ValidateTicketResponse>>(
      `/tickets/${ticketCode}/validate`,
    );
    return response.data.data;
  }
}

export const rewardService = new RewardService();
export const adminRewardService = new AdminRewardService();
