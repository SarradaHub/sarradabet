import { CreateVoteDTO } from "../types/vote.types";
import {
  createVoteWithOdds,
  VoteWithOddsUpdate,
} from "../repositories/vote.repository";
import { emitVoteCreated } from "../realtime/emitter";
import { cacheService } from "../core/cache/CacheService";

export const createVote = async (
  data: CreateVoteDTO,
): Promise<VoteWithOddsUpdate> => {
  const result = await createVoteWithOdds(data);

  cacheService.invalidateBet(result.betId);
  cacheService.invalidatePattern("bets:");

  emitVoteCreated({
    betId: result.betId,
    oddId: result.oddId,
    odds: result.odds,
    totalVotes: result.totalVotes,
  });

  return result;
};
