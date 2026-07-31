import type { BetListItem } from "./bet";

export const RealtimeEvents = {
  VOTE_CREATED: "vote:created",
  BET_CREATED: "bet:created",
  BET_UPDATED: "bet:updated",
  BET_RESOLVED: "bet:resolved",
  PAYMENT_CONFIRMED: "payment:confirmed",
  REWARD_VALIDATED: "reward:validated",
} as const;

export type RealtimeEventName =
  (typeof RealtimeEvents)[keyof typeof RealtimeEvents];

export type VoteCreatedPayload = {
  betId: number;
  oddId: number;
  odds: { id: number; totalVotes: number; value: number }[];
  totalVotes: number;
  totalStake: number;
};

export type BetCreatedPayload = BetListItem;

export type BetUpdatedPayload = BetListItem;

export type BetResolvedPayload = {
  betId: number;
  winningOddId: number;
  amount: number;
  newBalance: number;
};

export type PaymentConfirmedPayload = {
  paymentId: number;
  coinsAmount: number;
  newBalance: number;
  paidAt: string;
};

export type RewardValidatedPayload = {
  redemptionId: number;
  rewardTitle: string;
  ticketCode: string;
  redeemedAt: string;
  validatedAt: string;
};

export type RealtimePayloadMap = {
  [RealtimeEvents.VOTE_CREATED]: VoteCreatedPayload;
  [RealtimeEvents.BET_CREATED]: BetCreatedPayload;
  [RealtimeEvents.BET_UPDATED]: BetUpdatedPayload;
  [RealtimeEvents.BET_RESOLVED]: BetResolvedPayload;
  [RealtimeEvents.PAYMENT_CONFIRMED]: PaymentConfirmedPayload;
  [RealtimeEvents.REWARD_VALIDATED]: RewardValidatedPayload;
};
