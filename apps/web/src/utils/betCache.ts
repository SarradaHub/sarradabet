import type { BetListItem, VoteCreatedPayload } from "@sarradabet/types";
import { queryCache } from "../core/hooks/useQueryCache";
import { mergeOddFromVoteUpdate } from "./odds";
import { Bet } from "../types/bet";
import { getDisplayBetStatus, isBetInResolutionQueue } from "./betSchedule";

type PaginatedBetsResponse = {
  data?: Bet[];
  meta?: unknown;
};

type BetsQueryParams = {
  status?: string;
  excludeExpired?: boolean;
  queue?: string;
};

function parseBetsCacheKey(key: string): BetsQueryParams {
  if (!key.startsWith("bets-")) {
    return {};
  }

  try {
    return JSON.parse(key.slice("bets-".length)) as BetsQueryParams;
  } catch {
    return {};
  }
}

function shouldIncludeBetInCache(bet: Bet, params: BetsQueryParams): boolean {
  if (params.queue === "resolution") {
    return isBetInResolutionQueue(bet);
  }

  if (params.status) {
    const allowed = params.status.split(",").map((value) => value.trim());
    const displayStatus = getDisplayBetStatus(bet);
    if (!allowed.includes(displayStatus) && !allowed.includes(bet.status)) {
      return false;
    }
  }

  if (params.excludeExpired) {
    const displayStatus = getDisplayBetStatus(bet);
    if (displayStatus === "closed" || displayStatus === "resolved") {
      return false;
    }
  }

  if (params.status === "closed" && bet.status === "resolved") {
    return false;
  }

  return true;
}

function applyBetUpsertToList(
  bets: Bet[],
  bet: Bet,
  params: BetsQueryParams,
): Bet[] {
  const existingIndex = bets.findIndex((item) => item.id === bet.id);
  const include = shouldIncludeBetInCache(bet, params);

  if (!include) {
    if (existingIndex >= 0) {
      return bets.filter((item) => item.id !== bet.id);
    }
    return bets;
  }

  if (existingIndex >= 0) {
    const next = [...bets];
    next[existingIndex] = { ...next[existingIndex], ...bet };
    return next;
  }

  return [bet, ...bets];
}

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
  const bet = payload as Bet;

  queryCache.updateByPrefix<PaginatedBetsResponse | Bet[]>("bets-", (key, data) => {
    const params = parseBetsCacheKey(key);

    if (Array.isArray(data)) {
      return applyBetUpsertToList(data, bet, params);
    }

    if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) {
      return {
        ...data,
        data: applyBetUpsertToList(data.data, bet, params),
      };
    }

    return data;
  });
}
