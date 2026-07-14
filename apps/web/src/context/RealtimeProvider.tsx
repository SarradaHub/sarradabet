import {
  RealtimeEvents,
  type BetListItem,
  type VoteCreatedPayload,
} from "@sarradabet/types";
import { useSocketEvent } from "../core/hooks/useSocket";
import {
  patchBetsFromBetUpsert,
  patchBetsFromVote,
} from "../utils/betCache";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useSocketEvent<VoteCreatedPayload>(
    RealtimeEvents.VOTE_CREATED,
    patchBetsFromVote,
  );

  useSocketEvent<BetListItem>(RealtimeEvents.BET_CREATED, patchBetsFromBetUpsert);
  useSocketEvent<BetListItem>(RealtimeEvents.BET_UPDATED, patchBetsFromBetUpsert);

  return <>{children}</>;
}
