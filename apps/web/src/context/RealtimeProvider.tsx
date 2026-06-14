import {
  RealtimeEvents,
  type BetListItem,
  type VoteCreatedPayload,
} from "@sarradabet/types";
import { useSocketEvent } from "../core/hooks/useSocket";
import { queryCache } from "../core/hooks/useQueryCache";
import { Bet } from "../types/bet";

type PaginatedBetsResponse = {
  data?: Bet[];
  meta?: unknown;
};

function patchBetsCache(
  updater: (bets: Bet[]) => Bet[] | null,
): void {
  queryCache.updateByPrefix<PaginatedBetsResponse | Bet[]>("bets-", (_key, data) => {
    if (Array.isArray(data)) {
      const updated = updater(data);
      return updated;
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

function handleVoteCreated(payload: VoteCreatedPayload): void {
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
          return updated ? { ...odd, totalVotes: updated.totalVotes } : odd;
        }),
      };
    }),
  );
}

function handleBetUpsert(payload: BetListItem): void {
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

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useSocketEvent<VoteCreatedPayload>(
    RealtimeEvents.VOTE_CREATED,
    handleVoteCreated,
  );

  useSocketEvent<BetListItem>(RealtimeEvents.BET_CREATED, handleBetUpsert);
  useSocketEvent<BetListItem>(RealtimeEvents.BET_UPDATED, handleBetUpsert);

  return <>{children}</>;
}
