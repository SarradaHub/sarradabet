import type { LeaderboardEntry } from "@sarradabet/types";
import { config } from "../../../config/env";
import { getRedisClient } from "../../../config/redis";
import { UserStatsRepository } from "../repositories/UserStatsRepository";
import { calculateTier, LEADERBOARD_CACHE_KEY } from "../utils/ranking";

export class LeaderboardService {
  constructor(
    private readonly repository: UserStatsRepository = new UserStatsRepository(),
  ) {}

  async getTop(limit = 100): Promise<LeaderboardEntry[]> {
    const normalizedLimit = Math.min(Math.max(limit, 1), 100);
    const cached = await this.getFromCache(normalizedLimit);
    if (cached) {
      return cached;
    }

    const entries = await this.fetchFromDatabase(normalizedLimit);
    await this.setCache(normalizedLimit, entries);
    return entries;
  }

  async invalidateCache(): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      await redis.del(LEADERBOARD_CACHE_KEY);
    } catch {
      // Cache invalidation is best-effort.
    }
  }

  private async getFromCache(
    limit: number,
  ): Promise<LeaderboardEntry[] | null> {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    try {
      const cached = await redis.get(LEADERBOARD_CACHE_KEY);
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as LeaderboardEntry[];
      return parsed.slice(0, limit);
    } catch {
      return null;
    }
  }

  private async setCache(
    limit: number,
    entries: LeaderboardEntry[],
  ): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      await redis.setex(
        LEADERBOARD_CACHE_KEY,
        config.LEADERBOARD_CACHE_TTL,
        JSON.stringify(entries.slice(0, limit)),
      );
    } catch {
      // Cache write is best-effort.
    }
  }

  private async fetchFromDatabase(limit: number): Promise<LeaderboardEntry[]> {
    const rows = await this.repository.getTop(limit);

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.user.id,
      username: row.user.username,
      rankingScore: row.rankingScore,
      winRate: row.winRate,
      tier: calculateTier(row.rankingScore),
    }));
  }
}
