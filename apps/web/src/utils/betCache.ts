import type { BetListItem, VoteCreatedPayload } from "@sarradabet/types";
import { queryCache } from "../core/hooks/useQueryCache";
import { mergeOddFromVoteUpdate } from "./odds";
import { Bet } from "../types/bet";

type PaginatedBetsResponse = {
  data?: Bet[];
  meta?: unknown;
};

export function patchBetsCache(
  updater: (bets: Bet[]) => Bet[] | null,
): void {
  queryCache.updateByPrefix<PaginatedBetsResponse | Bet[]>("bets-", (_key, data) => {
    if (Array.isArray(data)) {
      return updater(data);
    }

    if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) {
      const updatedList = updater(data.data);
      if (updatedList === null) {
        return null;
      }
      return { ...data, data: updatedList };
    }

    return data;
  });
}

export function patchBetsFromVote(payload: VoteCreatedPayload): void {
  patchBetsCache((bets) =>
    bets.map((bet) => {
      if (bet.id !== payload.betId) {
        return bet;
      }

      return {
        ...bet,
        totalVotes: payload.totalVotes,
        odds: bet.odds.map((odd) => {
          const updated = payload.odds.find((o) => o.id === odd.id);
          return updated ? mergeOddFromVoteUpdate(odd, updated) : odd;
        }),
      };
    }),
  );
}

export function patchBetsFromBetUpsert(payload: BetListItem): void {
  patchBetsCache((bets) => {
    const existingIndex = bets.findIndex((bet) => bet.id === payload.id);
    const bet = payload as Bet;

    if (existingIndex >= 0) {
      const next = [...bets];
      next[existingIndex] = { ...next[existingIndex], ...bet };
      return next;
    }

    return [bet, ...bets];
  });
}
