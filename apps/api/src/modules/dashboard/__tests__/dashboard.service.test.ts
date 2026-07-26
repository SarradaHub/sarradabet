import type { UserDashboardResponse } from "@sarradabet/types";
import { DashboardRepository } from "../repositories/DashboardRepository";
import {
  DashboardService,
  invalidateDashboardCache,
} from "../services/DashboardService";
import { CoinService } from "../../coin/services/CoinService";
import { UserStatsService } from "../../stats/services/UserStatsService";
import { getRedisClient } from "../../../config/redis";

jest.mock("../../../config/redis", () => ({
  getRedisClient: jest.fn(),
}));

describe("DashboardService", () => {
  const repository = new DashboardRepository();
  const userStatsService = new UserStatsService();
  const coinService = new CoinService();
  const service = new DashboardService(
    repository,
    userStatsService,
    coinService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (getRedisClient as jest.Mock).mockReturnValue(null);
  });

  it("aggregates dashboard data for a user", async () => {
    jest.spyOn(coinService, "getBalance").mockResolvedValue({ balance: 150 });
    jest.spyOn(userStatsService, "getByUserId").mockResolvedValue({
      userId: 1,
      totalBets: 4,
      wonBets: 2,
      lostBets: 2,
      winRate: 0.5,
      rankingScore: 40,
      tier: "bronze",
      updatedAt: new Date().toISOString(),
    });
    jest.spyOn(repository, "getRankingPosition").mockResolvedValue(3);
    jest.spyOn(repository, "listRecentBets").mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    jest.spyOn(coinService, "listTransactions").mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    const result = await service.getUserDashboard(1, { page: 1, limit: 10 });

    expect(result.balance).toBe(150);
    expect(result.stats.totalBets).toBe(4);
    expect(result.ranking.position).toBe(3);
  });

  it("returns cached dashboard when available", async () => {
    const cached: UserDashboardResponse = {
      balance: 99,
      stats: {
        totalBets: 1,
        wonBets: 1,
        lostBets: 0,
        winRate: 1,
      },
      ranking: { score: 10, position: 1 },
      recentBets: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
      recentTransactions: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
    };

    const redis = {
      get: jest.fn().mockResolvedValue(JSON.stringify(cached)),
      setex: jest.fn(),
    };
    (getRedisClient as jest.Mock).mockReturnValue(redis);

    const balanceSpy = jest.spyOn(coinService, "getBalance");

    const result = await service.getUserDashboard(1, { page: 1, limit: 10 });

    expect(result.balance).toBe(99);
    expect(balanceSpy).not.toHaveBeenCalled();
  });

  it("invalidates dashboard cache keys for a user", async () => {
    const redis = {
      keys: jest.fn().mockResolvedValue(["dashboard:user:1:1:10"]),
      del: jest.fn().mockResolvedValue(1),
    };
    (getRedisClient as jest.Mock).mockReturnValue(redis);

    await invalidateDashboardCache(1);

    expect(redis.keys).toHaveBeenCalledWith("dashboard:user:1:*");
    expect(redis.del).toHaveBeenCalledWith("dashboard:user:1:1:10");
  });
});
