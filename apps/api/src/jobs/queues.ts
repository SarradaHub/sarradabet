import Queue from "bull";
import { config } from "../config/env";

export const BET_STATUS_QUEUE = "bet-status";
export const PAYOUT_RESOLVE_BET_QUEUE = "payout:resolve-bet";
export const PAYOUT_VOTE_QUEUE = "payout:vote";
export const ANALYTICS_REFRESH_QUEUE = "analytics:refresh";

export type BetStatusJobData = Record<string, never>;

export type PayoutResolveBetJobData = {
  betId: number;
  winningOddId: number;
};

export type PayoutVoteJobData = {
  voteId: number;
};

export type AnalyticsRefreshJobData = Record<string, never>;

const queueOptions: Queue.QueueOptions = {
  redis: config.REDIS_URL,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
};

let betStatusQueue: Queue.Queue<BetStatusJobData> | null = null;
let payoutResolveBetQueue: Queue.Queue<PayoutResolveBetJobData> | null = null;
let payoutVoteQueue: Queue.Queue<PayoutVoteJobData> | null = null;
let analyticsRefreshQueue: Queue.Queue<AnalyticsRefreshJobData> | null = null;

export function getBetStatusQueue(): Queue.Queue<BetStatusJobData> {
  if (!betStatusQueue) {
    betStatusQueue = new Queue(BET_STATUS_QUEUE, queueOptions);
  }
  return betStatusQueue;
}

export function getPayoutResolveBetQueue(): Queue.Queue<PayoutResolveBetJobData> {
  if (!payoutResolveBetQueue) {
    payoutResolveBetQueue = new Queue(PAYOUT_RESOLVE_BET_QUEUE, queueOptions);
  }
  return payoutResolveBetQueue;
}

export function getPayoutVoteQueue(): Queue.Queue<PayoutVoteJobData> {
  if (!payoutVoteQueue) {
    payoutVoteQueue = new Queue(PAYOUT_VOTE_QUEUE, queueOptions);
  }
  return payoutVoteQueue;
}

export function getAnalyticsRefreshQueue(): Queue.Queue<AnalyticsRefreshJobData> {
  if (!analyticsRefreshQueue) {
    analyticsRefreshQueue = new Queue(ANALYTICS_REFRESH_QUEUE, queueOptions);
  }
  return analyticsRefreshQueue;
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([
    betStatusQueue?.close(),
    payoutResolveBetQueue?.close(),
    payoutVoteQueue?.close(),
    analyticsRefreshQueue?.close(),
  ]);
  betStatusQueue = null;
  payoutResolveBetQueue = null;
  payoutVoteQueue = null;
  analyticsRefreshQueue = null;
}
