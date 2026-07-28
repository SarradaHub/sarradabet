import { CreateVoteDTO } from "../types/vote.types";
import {
  createVoteWithOdds,
  VoteWithOddsUpdate,
} from "../repositories/vote.repository";
import { emitVoteCreated } from "../realtime/emitter";
import { cacheService } from "../core/cache/CacheService";
import { invalidateDashboardCache } from "../modules/dashboard/services/DashboardService";

export const createVote = async (
  data: CreateVoteDTO,
  userId: number,
): Promise<VoteWithOddsUpdate> => {
  const result = await createVoteWithOdds(data, userId);

  cacheService.invalidateBet(result.betId);
  cacheService.invalidatePattern("bets:");
  await invalidateDashboardCache(userId);

  emitVoteCreated({
    betId: result.betId,
    oddId: result.oddId,
    odds: result.odds,
    totalVotes: result.totalVotes,
    totalStake: result.totalStake,
  });

  return result;
};
