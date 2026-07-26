import { UserStats } from "@prisma/client";
import { prisma } from "../../../config/db";
import type { UserStats as UserStatsDto } from "@sarradabet/types";
import {
  calculateRankingScore,
  calculateTier,
  calculateWinRate,
} from "../utils/ranking";

export class UserStatsRepository {
  async findByUserId(userId: number): Promise<UserStats | null> {
    return prisma.userStats.findUnique({ where: { userId } });
  }

  async upsert(
    userId: number,
    data: {
      totalBets: number;
      wonBets: number;
      lostBets: number;
      winRate: number;
      rankingScore: number;
    },
  ): Promise<UserStats> {
    return prisma.userStats.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async getTop(limit: number) {
    return prisma.userStats.findMany({
      take: limit,
      orderBy: { rankingScore: "desc" },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });
  }

  toDto(stats: UserStats): UserStatsDto {
    return {
      userId: stats.userId,
      totalBets: stats.totalBets,
      wonBets: stats.wonBets,
      lostBets: stats.lostBets,
      winRate: stats.winRate,
      rankingScore: stats.rankingScore,
      tier: calculateTier(stats.rankingScore),
      updatedAt: stats.updatedAt.toISOString(),
    };
  }

  async getCoinBalance(userId: number): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });
    return user?.coinBalance ?? 0;
  }

  buildStatsPayload(
    totalBets: number,
    wonBets: number,
    lostBets: number,
    coinBalance: number,
  ) {
    const winRate = calculateWinRate(wonBets, totalBets);
    const rankingScore = calculateRankingScore(wonBets, coinBalance);
    return { totalBets, wonBets, lostBets, winRate, rankingScore };
  }
}
