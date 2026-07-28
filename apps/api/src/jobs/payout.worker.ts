import {
  CoinTransactionSource,
  VoteStatus,
} from "@prisma/client";
import { prisma } from "../config/db";
import { calculatePayout } from "../utils/parimutuel";
import { CoinRepository } from "../modules/coin/repositories/CoinRepository";
import { emitBetResolved } from "../realtime/emitter";
import { logger } from "../utils/logger";
import {
  getPayoutResolveBetQueue,
  getPayoutVoteQueue,
} from "./queues";
import { UserStatsService } from "../modules/stats/services/UserStatsService";

const coinRepository = new CoinRepository();
const userStatsService = new UserStatsService();

export async function enqueuePayoutJobs(
  betId: number,
  winningOddId: number,
): Promise<number> {
  if (process.env.NODE_ENV === "test") {
    await processPayoutResolveBetJob({ betId, winningOddId });
    const winningVotes = await prisma.vote.count({
      where: { oddId: winningOddId, status: VoteStatus.pending },
    });
    return winningVotes;
  }

  await getPayoutResolveBetQueue().add({ betId, winningOddId });
  const winningVotes = await prisma.vote.count({
    where: { oddId: winningOddId, status: VoteStatus.pending },
  });
  return winningVotes;
}

export async function processPayoutResolveBetJob(data: {
  betId: number;
  winningOddId: number;
}): Promise<void> {
  const winningVotes = await prisma.vote.findMany({
    where: {
      oddId: data.winningOddId,
      status: VoteStatus.pending,
      odd: { betId: data.betId },
    },
    select: { id: true },
  });

  if (process.env.NODE_ENV === "test") {
    for (const vote of winningVotes) {
      await processPayoutVoteJob({ voteId: vote.id });
    }
    return;
  }

  const queue = getPayoutVoteQueue();
  await Promise.all(
    winningVotes.map((vote) => queue.add({ voteId: vote.id })),
  );
}

export async function processPayoutVoteJob(data: {
  voteId: number;
}): Promise<{ paid: boolean; amount: number; userId: number } | null> {
  const vote = await prisma.vote.findUnique({
    where: { id: data.voteId },
    include: {
      odd: {
        include: {
          bet: {
            include: {
              odds: {
                include: {
                  votes: {
                    where: { status: { not: VoteStatus.lost } },
                    select: { amount: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!vote) {
    return null;
  }

  if (vote.status === VoteStatus.paid) {
    logger.warn("Duplicate payout attempt", { voteId: vote.id });
    return null;
  }

  if (vote.odd.result !== "won") {
    if (vote.status === VoteStatus.pending) {
      await prisma.vote.update({
        where: { id: vote.id },
        data: { status: VoteStatus.lost },
      });
    }
    return null;
  }

  const bet = vote.odd.bet;
  const totalPool = bet.odds.reduce(
    (sum, odd) =>
      sum + odd.votes.reduce((acc: number, v) => acc + v.amount, 0),
    0,
  );
  const winningOdd = bet.odds.find((odd) => odd.id === vote.oddId);
  const winningPool =
    winningOdd?.votes.reduce((sum: number, v) => sum + v.amount, 0) ?? 0;
  const payoutAmount = calculatePayout(vote.amount, totalPool, winningPool);

  if (payoutAmount <= 0) {
    await prisma.vote.update({
      where: { id: vote.id },
      data: { status: VoteStatus.paid, payoutAmount: 0, paidAt: new Date() },
    });
    await userStatsService.recordWin(vote.userId);
    return { paid: true, amount: 0, userId: vote.userId };
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.vote.findUnique({ where: { id: vote.id } });
    if (!current || current.status === VoteStatus.paid) {
      logger.warn("Duplicate payout attempt in transaction", {
        voteId: vote.id,
      });
      return null;
    }

    const transaction = await coinRepository.creditCoins(
      tx,
      vote.userId,
      payoutAmount,
      {
        source: CoinTransactionSource.WIN,
        referenceId: vote.id,
        externalId: `win:vote:${vote.id}`,
        description: `Prêmio aposta ${bet.id}`,
      },
    );

    await tx.vote.update({
      where: { id: vote.id },
      data: {
        status: VoteStatus.paid,
        payoutAmount,
        paidAt: new Date(),
      },
    });

    return {
      paid: true,
      amount: payoutAmount,
      userId: vote.userId,
      newBalance: transaction.balanceAfter,
      betId: bet.id,
      winningOddId: vote.oddId,
    };
  });

  if (result) {
    await userStatsService.recordWin(result.userId, result.newBalance);
    emitBetResolved(result.userId, {
      betId: result.betId,
      winningOddId: result.winningOddId,
      amount: result.amount,
      newBalance: result.newBalance,
    });
  }

  return result;
}
