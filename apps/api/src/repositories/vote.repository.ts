import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { CreateVoteDTO } from "../types/vote.types";
import { ConflictError, NotFoundError } from "../core/errors/AppError";
import { calculateOddsFromVotes } from "../utils/odds";

export type VoteWithOddsUpdate = {
  vote: { id: number; oddId: number; createdAt: Date };
  betId: number;
  oddId: number;
  odds: { id: number; totalVotes: number; value: number }[];
  totalVotes: number;
};

export const createVoteWithOdds = async (
  data: CreateVoteDTO,
): Promise<VoteWithOddsUpdate> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const odd = await tx.odd.findUnique({
      where: { id: data.oddId },
      select: {
        id: true,
        betId: true,
        bet: {
          select: { status: true },
        },
      },
    });

    if (!odd) {
      throw new NotFoundError("Odd", data.oddId);
    }

    if (odd.bet.status !== "open") {
      throw new ConflictError("Only open bets accept votes");
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
      orderBy: { id: "asc" },
    });

    const voteCounts = oddsWithCounts.map((o) => o._count.votes);
    const calculatedValues = calculateOddsFromVotes(voteCounts);

    const updatedOdds = await Promise.all(
      oddsWithCounts.map((o, index) =>
        tx.odd.update({
          where: { id: o.id },
          data: { value: calculatedValues[index] },
          select: {
            id: true,
            value: true,
            _count: {
              select: { votes: true },
            },
          },
        }),
      ),
    );

    const odds = updatedOdds.map((o) => ({
      id: o.id,
      totalVotes: o._count.votes,
      value: o.value,
    }));

    const totalVotes = odds.reduce((sum, o) => sum + o.totalVotes, 0);

    return {
      vote,
      betId: odd.betId,
      oddId: data.oddId,
      odds,
      totalVotes,
    };
  });
};
