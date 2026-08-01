import type { UserDashboardResponse } from "@sarradabet/types";
import { getRedisClient } from "../../../config/redis";
import { PaginationParams } from "../../../core/interfaces/IRepository";
import { CoinService } from "../../coin/services/CoinService";
import { UserStatsService } from "../../stats/services/UserStatsService";
import { DashboardRepository } from "../repositories/DashboardRepository";

export const DASHBOARD_CACHE_PREFIX = "dashboard:user:";
export const DASHBOARD_CACHE_TTL_SECONDS = 60;

function buildCacheKey(userId: number, page: number, limit: number): string {
  return `${DASHBOARD_CACHE_PREFIX}${userId}:${page}:${limit}`;
}

export async function invalidateDashboardCache(userId: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    const pattern = `${DASHBOARD_CACHE_PREFIX}${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Cache invalidation is best-effort.
  }
}

export class DashboardService {
  constructor(
    private readonly repository: DashboardRepository = new DashboardRepository(),
    private readonly userStatsService: UserStatsService = new UserStatsService(),
    private readonly coinService: CoinService = new CoinService(),
  ) {}

  async getUserDashboard(
    userId: number,
    params: PaginationParams,
  ): Promise<UserDashboardResponse> {
    const cached = await this.getFromCache(userId, params);
    if (cached) {
      return cached;
    }

    const dashboard = await this.buildDashboard(userId, params);
    await this.setCache(userId, params, dashboard);
    return dashboard;
  }

  private async buildDashboard(
    userId: number,
    params: PaginationParams,
  ): Promise<UserDashboardResponse> {
    const [balanceResult, stats, rankingPosition, recentBets, transactions] =
      await Promise.all([
        this.coinService.getBalance(userId),
        this.userStatsService.getByUserId(userId),
        this.repository.getRankingPosition(userId),
        this.repository.listRecentBets(userId, params),
        this.coinService.listTransactions(userId, params),
      ]);

    const recentTransactions = await this.repository.mapCoinTransactions(
      transactions.items,
      transactions.page,
      transactions.limit,
      transactions.total,
    );

    return {
      balance: balanceResult.balance,
      stats: {
        totalBets: stats.totalBets,
        wonBets: stats.wonBets,
        lostBets: stats.lostBets,
        winRate: stats.winRate,
      },
      ranking: {
        score: stats.rankingScore,
        position: rankingPosition,
      },
      recentBets,
      recentTransactions,
    };
  }

  private async getFromCache(
    userId: number,
    params: PaginationParams,
  ): Promise<UserDashboardResponse | null> {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    try {
      const cached = await redis.get(
        buildCacheKey(userId, params.page, params.limit),
      );
      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as UserDashboardResponse;
    } catch {
      return null;
    }
  }

  private async setCache(
    userId: number,
    params: PaginationParams,
    dashboard: UserDashboardResponse,
  ): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      await redis.setex(
        buildCacheKey(userId, params.page, params.limit),
        DASHBOARD_CACHE_TTL_SECONDS,
        JSON.stringify(dashboard),
      );
    } catch {
      // Cache write is best-effort.
    }
  }
}
