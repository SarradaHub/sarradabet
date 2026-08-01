import { voteService } from "../services/VoteService";
import type { CreateVoteResponse } from "../types/vote";
import {
  optimisticPatchFromVote,
  patchBetsFromVote,
  restoreBetsCache,
  snapshotBetsCache,
} from "./betCache";

export async function submitVoteWithOptimism(params: {
  oddId: number;
  amount: number;
  betId: number;
  onBalanceAdjust: (delta: number) => void;
}): Promise<CreateVoteResponse> {
  const snapshot = snapshotBetsCache();

  optimisticPatchFromVote({
    betId: params.betId,
    oddId: params.oddId,
    amount: params.amount,
  });
  params.onBalanceAdjust(-params.amount);

  try {
    const response = await voteService.create({
      oddId: params.oddId,
      amount: params.amount,
    });

    if (!response.success || !response.data) {
      throw new Error(
        response.message ?? "Não foi possível registrar o voto.",
      );
    }

    patchBetsFromVote({
      betId: response.data.betId,
      oddId: params.oddId,
      odds: response.data.odds,
      totalVotes: response.data.totalVotes,
      totalStake: response.data.totalStake,
    });

    return response.data;
  } catch (error) {
    restoreBetsCache(snapshot);
    params.onBalanceAdjust(params.amount);
    throw error;
  }
}
