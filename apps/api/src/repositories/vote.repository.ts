import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { CreateVoteDTO } from "../types/vote.types";
import { NotFoundError } from "../core/errors/AppError";

export type VoteWithOddsUpdate = {
  vote: { id: number; oddId: number; createdAt: Date };
  betId: number;
  oddId: number;
  odds: { id: number; totalVotes: number }[];
  totalVotes: number;
};

export const createVoteWithOdds = async (
  data: CreateVoteDTO,
): Promise<VoteWithOddsUpdate> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const odd = await tx.odd.findUnique({
      where: { id: data.oddId },
      select: { id: true, betId: true },
    });

    if (!odd) {
      throw new NotFoundError("Odd", data.oddId);
    }

    const vote = await tx.vote.create({
      data: { oddId: data.oddId },
    });

    const oddsWithCounts = await tx.odd.findMany({
      where: { betId: odd.betId },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });

    const odds = oddsWithCounts.map((o: (typeof oddsWithCounts)[number]) => ({
      id: o.id,
      totalVotes: o._count.votes,
    }));

    const totalVotes = odds.reduce(
      (sum: number, o: (typeof odds)[number]) => sum + o.totalVotes,
      0,
    );

    return {
      vote,
      betId: odd.betId,
      oddId: data.oddId,
      odds,
      totalVotes,
    };
  });
};
