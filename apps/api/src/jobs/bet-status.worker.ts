import { prisma } from "../config/db";
import { emitBetUpdated } from "../realtime/emitter";
import { toBetListItem } from "../modules/bet/mappers/bet.mapper";
import { BetRepository } from "../modules/bet/repositories/BetRepository";
import { cacheService } from "../core/cache/CacheService";
import { logger } from "../utils/logger";

const betRepository = new BetRepository(prisma);

export async function runBetStatusTransitions(): Promise<{
  opened: number;
  closed: number;
}> {
  const now = new Date();

  const scheduledCandidates = await prisma.bet.findMany({
    where: {
      status: "scheduled",
      startTime: { lte: now },
    },
    select: { id: true },
  });

  const openCandidates = await prisma.bet.findMany({
    where: {
      status: "open",
      closesAt: { lte: now },
    },
    select: { id: true },
  });

  const scheduledToOpen =
    scheduledCandidates.length > 0
      ? await prisma.bet.updateMany({
          where: {
            id: { in: scheduledCandidates.map((bet) => bet.id) },
          },
          data: { status: "open" },
        })
      : { count: 0 };

  const openToClosed =
    openCandidates.length > 0
      ? await prisma.bet.updateMany({
          where: {
            id: { in: openCandidates.map((bet) => bet.id) },
          },
          data: { status: "closed" },
        })
      : { count: 0 };

  if (scheduledToOpen.count > 0 || openToClosed.count > 0) {
    cacheService.invalidatePattern("bets:");

    const updatedIds = [
      ...scheduledCandidates.map((bet) => bet.id),
      ...openCandidates.map((bet) => bet.id),
    ];

    for (const betId of updatedIds) {
      const bet = await betRepository.findUnique({ id: betId });
      if (bet) {
        emitBetUpdated(toBetListItem(bet));
      }
    }
  }

  logger.info("Bet status job completed", {
    opened: scheduledToOpen.count,
    closed: openToClosed.count,
  });

  return {
    opened: scheduledToOpen.count,
    closed: openToClosed.count,
  };
}
