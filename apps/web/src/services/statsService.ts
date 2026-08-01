import type { LeaderboardEntry, UserStats } from "@sarradabet/types";
import type { ApiResponse } from "../core/interfaces/IService";
import { createApiClient } from "./apiClient";

class StatsService {
  private readonly leaderboardApi = createApiClient("leaderboard");
  private readonly usersApi = createApiClient("users");

  async getLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
    const response = await this.leaderboardApi.get<
      ApiResponse<LeaderboardEntry[]>
    >("/", { params: { limit } });
    return response.data.data;
  }

  async getMyStats(): Promise<UserStats> {
    const response = await this.usersApi.get<ApiResponse<UserStats>>(
      "/me/stats",
    );
    return response.data.data;
  }
}

export const statsService = new StatsService();
