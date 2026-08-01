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

  const scheduledToOpen = await prisma.bet.updateMany({
    where: {
      status: "scheduled",
      startTime: { lte: now },
    },
    data: { status: "open" },
  });

  const openToClosed = await prisma.bet.updateMany({
    where: {
      status: "open",
      closesAt: { lte: now },
    },
    data: { status: "closed" },
  });

  if (scheduledToOpen.count > 0 || openToClosed.count > 0) {
    cacheService.invalidatePattern("bets:");

    const updatedBets = await prisma.bet.findMany({
      where: {
        OR: [
          {
            status: "open",
            startTime: { lte: now },
          },
          {
            status: "closed",
            closesAt: { lte: now },
          },
        ],
      },
      select: { id: true },
    });

    for (const betRef of updatedBets) {
      const bet = await betRepository.findUnique({ id: betRef.id });
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
