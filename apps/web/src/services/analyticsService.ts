import type {
  AnalyticsOverview,
  BetsByCategoryRow,
  PeakHourEntry,
  PixRevenuePoint,
} from "@sarradabet/types";
import type { ApiResponse } from "../core/interfaces/IService";
import { createApiClient, getApiRootUrl } from "./apiClient";

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  categoryId?: number;
}

class AnalyticsService {
  private readonly analyticsApi = createApiClient("admin/analytics");

  async getOverview(filters: AnalyticsFilters): Promise<AnalyticsOverview> {
    const response = await this.analyticsApi.get<ApiResponse<AnalyticsOverview>>(
      "/overview",
      { params: filters },
    );
    return response.data.data;
  }

  async getBetsByCategory(
    filters: AnalyticsFilters,
  ): Promise<BetsByCategoryRow[]> {
    const response = await this.analyticsApi.get<
      ApiResponse<BetsByCategoryRow[]>
    >("/bets-by-category", { params: filters });
    return response.data.data;
  }

  async getPixRevenue(filters: AnalyticsFilters): Promise<PixRevenuePoint[]> {
    const response = await this.analyticsApi.get<
      ApiResponse<PixRevenuePoint[]>
    >("/pix-revenue", { params: filters });
    return response.data.data;
  }

  async getPeakHours(filters: AnalyticsFilters): Promise<PeakHourEntry[]> {
    const response = await this.analyticsApi.get<ApiResponse<PeakHourEntry[]>>(
      "/peak-hours",
      { params: filters },
    );
    return response.data.data;
  }

  getExportUrl(filters: AnalyticsFilters): string {
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      format: "csv",
    });
    if (filters.categoryId) {
      params.set("categoryId", String(filters.categoryId));
    }
    return `${getApiRootUrl()}/api/v1/admin/analytics/export?${params.toString()}`;
  }
}

export const analyticsService = new AnalyticsService();
