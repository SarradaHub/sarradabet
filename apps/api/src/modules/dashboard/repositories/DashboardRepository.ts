import type {
  DashboardCoinTransaction,
  PaginatedList,
  RecentBetEntry,
  VoteStatus,
} from "@sarradabet/types";
import { CoinTransactionSource, CoinTransactionType, VoteStatus as PrismaVoteStatus } from "@prisma/client";
import { prisma } from "../../../config/db";
import { PaginationParams } from "../../../core/interfaces/IRepository";

function resolveWinDisplayAmount(
  creditedAmount: number,
  stake: number,
  oddValue: number,
  payoutAmount: number | null,
): number {
  const quotedReturn = Math.floor(stake * oddValue);
  return Math.max(creditedAmount, payoutAmount ?? 0, quotedReturn);
}

export class DashboardRepository {
  async getRankingPosition(userId: number): Promise<number | null> {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { rankingScore: true, totalBets: true },
    });

    if (!userStats || userStats.totalBets === 0) {
      return null;
    }

    const higherRanked = await prisma.userStats.count({
      where: {
        rankingScore: { gt: userStats.rankingScore },
      },
    });

    return higherRanked + 1;
  }

  async listRecentBets(
    userId: number,
    params: PaginationParams,
  ): Promise<PaginatedList<RecentBetEntry>> {
    const skip = (params.page - 1) * params.limit;

    const [votes, total] = await Promise.all([
      prisma.vote.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
        include: {
          odd: {
            select: {
              title: true,
              value: true,
              bet: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.vote.count({ where: { userId } }),
    ]);

    return {
      data: votes.map((vote) => this.toRecentBetEntry(vote)),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit) || 0,
      },
    };
  }

  private toRecentBetEntry(vote: {
    id: number;
    amount: number;
    status: PrismaVoteStatus;
    payoutAmount: number | null;
    createdAt: Date;
    odd: {
      title: string;
      value: number;
      bet: { id: number; title: string };
    };
  }): RecentBetEntry {
    return {
      id: vote.id,
      betId: vote.odd.bet.id,
      betTitle: vote.odd.bet.title,
      oddTitle: vote.odd.title,
      amount: vote.amount,
      oddValue: vote.odd.value,
      status: vote.status as VoteStatus,
      payoutAmount: vote.payoutAmount,
      createdAt: vote.createdAt.toISOString(),
    };
  }

  async mapCoinTransactions(
    items: {
      id: number;
      userId: number;
      type: CoinTransactionType;
      amount: number;
      balanceAfter: number;
      source: CoinTransactionSource;
      referenceId: number | null;
      externalId: string | null;
      description: string | null;
      createdAt: Date;
    }[],
    page: number,
    limit: number,
    total: number,
  ): Promise<PaginatedList<DashboardCoinTransaction>> {
    const winReferenceIds = items
      .filter((item) => item.source === CoinTransactionSource.WIN && item.referenceId)
      .map((item) => item.referenceId as number);

    const votes =
      winReferenceIds.length > 0
        ? await prisma.vote.findMany({
            where: { id: { in: winReferenceIds } },
            include: { odd: { select: { value: true } } },
          })
        : [];

    const voteById = new Map(votes.map((vote) => [vote.id, vote]));

    return {
      data: items.map((item) => {
        let displayAmount = item.amount;

        if (item.source === CoinTransactionSource.WIN && item.referenceId) {
          const vote = voteById.get(item.referenceId);
          if (vote) {
            displayAmount = resolveWinDisplayAmount(
              item.amount,
              vote.amount,
              vote.odd.value,
              vote.payoutAmount,
            );
          }
        }

        return {
          id: item.id,
          userId: item.userId,
          type: item.type,
          amount: item.amount,
          displayAmount,
          balanceAfter: item.balanceAfter,
          source: item.source,
          referenceId: item.referenceId,
          externalId: item.externalId,
          description: item.description,
          createdAt: item.createdAt.toISOString(),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
}
