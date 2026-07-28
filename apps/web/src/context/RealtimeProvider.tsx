import {
  RealtimeEvents,
  type BetListItem,
  type BetResolvedPayload,
  type PaymentConfirmedPayload,
  type RewardValidatedPayload,
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

  useSocketEvent<PaymentConfirmedPayload>(
    RealtimeEvents.PAYMENT_CONFIRMED,
    () => {
      window.dispatchEvent(new CustomEvent("payment:confirmed"));
    },
  );

  useSocketEvent<BetResolvedPayload>(RealtimeEvents.BET_RESOLVED, (payload) => {
    window.dispatchEvent(
      new CustomEvent("bet:resolved", { detail: payload }),
    );
  });

  useSocketEvent<RewardValidatedPayload>(
    RealtimeEvents.REWARD_VALIDATED,
    (payload) => {
      window.dispatchEvent(
        new CustomEvent("reward:validated", { detail: payload }),
      );
    },
  );

  return <>{children}</>;
}
