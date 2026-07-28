import { CoinTransactionSource, Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { CreateVoteDTO } from "../types/vote.types";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../core/errors/AppError";
import { calculateOddsFromStakes } from "../utils/parimutuel";
import {
  isBetAcceptingWagers,
  wagerRejectionMessage,
} from "../utils/betSchedule";
import { CoinRepository } from "../modules/coin/repositories/CoinRepository";

export type VoteWithOddsUpdate = {
  vote: {
    id: number;
    oddId: number;
    userId: number;
    amount: number;
    status: string;
    createdAt: Date;
  };
  betId: number;
  oddId: number;
  odds: { id: number; totalVotes: number; totalStake: number; value: number }[];
  totalVotes: number;
  totalStake: number;
};

type OddWithVotes = {
  id: number;
  _count: { votes: number };
  votes: { amount: number }[];
};

type UpdatedOddWithVotes = {
  id: number;
  value: number;
  _count: { votes: number };
  votes: { amount: number }[];
};

const coinRepository = new CoinRepository();

function sumStake(votes: { amount: number }[]): number {
  return votes.reduce((sum, vote) => sum + vote.amount, 0);
}

export const createVoteWithOdds = async (
  data: CreateVoteDTO,
  userId: number,
): Promise<VoteWithOddsUpdate> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const odd = await tx.odd.findUnique({
      where: { id: data.oddId },
      select: {
        id: true,
        betId: true,
        bet: {
          select: { status: true, startTime: true, closesAt: true },
        },
      },
    });

    if (!odd) {
      throw new NotFoundError("Odd", data.oddId);
    }

    if (!isBetAcceptingWagers(odd.bet)) {
      throw new ConflictError(wagerRejectionMessage(odd.bet));
    }

    const vote = await tx.vote.create({
      data: {
        oddId: data.oddId,
        userId,
        amount: data.amount,
        status: "pending",
      },
    });

    try {
      await coinRepository.debitCoins(tx, userId, data.amount, {
        source: CoinTransactionSource.BET_COST,
        referenceId: vote.id,
        description: `Aposta na odd ${data.oddId}`,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
        throw new BadRequestError("Saldo insuficiente");
      }
      throw error;
    }

    const oddsWithVotes: OddWithVotes[] = await tx.odd.findMany({
      where: { betId: odd.betId },
      include: {
        _count: {
          select: { votes: true },
        },
        votes: {
          select: { amount: true },
        },
      },
      orderBy: { id: "asc" },
    });

    const stakeAmounts = oddsWithVotes.map((o) => sumStake(o.votes));
    const calculatedValues = calculateOddsFromStakes(stakeAmounts);

    const updatedOdds: UpdatedOddWithVotes[] = await Promise.all(
      oddsWithVotes.map((o, index) =>
        tx.odd.update({
          where: { id: o.id },
          data: { value: calculatedValues[index] },
          select: {
            id: true,
            value: true,
            _count: {
              select: { votes: true },
            },
            votes: {
              select: { amount: true },
            },
          },
        }),
      ),
    );

    const odds = updatedOdds.map((o) => ({
      id: o.id,
      totalVotes: o._count.votes,
      totalStake: sumStake(o.votes),
      value: o.value,
    }));

    const totalVotes = odds.reduce((sum, o) => sum + o.totalVotes, 0);
    const totalStake = odds.reduce((sum, o) => sum + o.totalStake, 0);

    return {
      vote: {
        id: vote.id,
        oddId: vote.oddId,
        userId: vote.userId,
        amount: vote.amount,
        status: vote.status,
        createdAt: vote.createdAt,
      },
      betId: odd.betId,
      oddId: data.oddId,
      odds,
      totalVotes,
      totalStake,
    };
  });
};
