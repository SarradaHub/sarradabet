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

export type BetsCacheSnapshot = Map<string, unknown>;

export function snapshotBetsCache(): BetsCacheSnapshot {
  const snapshot: BetsCacheSnapshot = new Map();

  for (const key of queryCache.keysMatching("bets-")) {
    const data = queryCache.getRaw(key);
    if (data !== null) {
      snapshot.set(key, structuredClone(data));
    }
  }

  return snapshot;
}

export function restoreBetsCache(snapshot: BetsCacheSnapshot): void {
  for (const [key, data] of snapshot) {
    queryCache.set(key, data);
  }
}

export function optimisticPatchFromVote(params: {
  betId: number;
  oddId: number;
  amount: number;
}): void {
  patchBetsCache((bets) =>
    bets.map((bet) => {
      if (bet.id !== params.betId) {
        return bet;
      }

      return {
        ...bet,
        totalVotes: bet.totalVotes + 1,
        totalStake: (bet.totalStake ?? 0) + params.amount,
        odds: bet.odds.map((odd) => {
          if (odd.id !== params.oddId) {
            return odd;
          }

          return {
            ...odd,
            totalVotes: odd.totalVotes + 1,
            totalStake: (odd.totalStake ?? 0) + params.amount,
          };
        }),
      };
    }),
  );
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
        totalStake: payload.totalStake ?? bet.totalStake,
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
