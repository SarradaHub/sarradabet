import type { BetListItem } from "./bet";

export const RealtimeEvents = {
  VOTE_CREATED: "vote:created",
  BET_CREATED: "bet:created",
  BET_UPDATED: "bet:updated",
  PAYMENT_CONFIRMED: "payment:confirmed",
} as const;

export type RealtimeEventName =
  (typeof RealtimeEvents)[keyof typeof RealtimeEvents];

export type VoteCreatedPayload = {
  betId: number;
  oddId: number;
  odds: { id: number; totalVotes: number; value: number }[];
  totalVotes: number;
};

export type BetCreatedPayload = BetListItem;

export type BetUpdatedPayload = BetListItem;

export type PaymentConfirmedPayload = {
  paymentId: number;
  coinsAmount: number;
  newBalance: number;
  paidAt: string;
};

export type RealtimePayloadMap = {
  [RealtimeEvents.VOTE_CREATED]: VoteCreatedPayload;
  [RealtimeEvents.BET_CREATED]: BetCreatedPayload;
  [RealtimeEvents.BET_UPDATED]: BetUpdatedPayload;
  [RealtimeEvents.PAYMENT_CONFIRMED]: PaymentConfirmedPayload;
};
