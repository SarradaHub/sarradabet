import { BaseService } from "../core/base/BaseService";
import { Bet, CreateBetDto, UpdateBetDto } from "../types/bet";
import { ApiResponse } from "../core/interfaces/IService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export class BetService extends BaseService<Bet, CreateBetDto, UpdateBetDto> {
  constructor() {
    super(API_BASE_URL, "bets");
  }

  async getBetsByStatus(status: string): Promise<ApiResponse<Bet[]>> {
    const response = await this.getWithParams({ status });
    return response;
  }

  async getBetsByCategory(categoryId: number): Promise<ApiResponse<Bet[]>> {
    const response = await this.getWithParams({ categoryId });
    return response;
  }

  async closeBet(id: number): Promise<ApiResponse<Bet>> {
    const response = await this.api.patch<ApiResponse<Bet>>(`/${id}/close`);
    return response.data;
  }

  async resolveBet(
    id: number,
    winningOddId: number,
  ): Promise<ApiResponse<Bet>> {
    const response = await this.api.patch<ApiResponse<Bet>>(`/${id}/resolve`, {
      winningOddId,
    });
    return response.data;
  }

  async getBetsWithPagination(
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      status?: string;
      categoryId?: number;
    } = {},
  ): Promise<ApiResponse<Bet[]>> {
    const response = await this.getWithParams(params);
    return response;
  }
}

export const betService = new BetService();
