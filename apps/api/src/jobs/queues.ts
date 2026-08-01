import { Queue, type JobsOptions } from "bullmq";
import { config } from "../config/env";

export const BET_STATUS_QUEUE = "bet-status";
export const PAYOUT_RESOLVE_BET_QUEUE = "payout-resolve-bet";
export const PAYOUT_VOTE_QUEUE = "payout-vote";
export const ANALYTICS_REFRESH_QUEUE = "analytics-refresh";

export type BetStatusJobData = Record<string, never>;

export type PayoutResolveBetJobData = {
  betId: number;
  winningOddId: number;
};

export type PayoutVoteJobData = {
  voteId: number;
};

export type AnalyticsRefreshJobData = Record<string, never>;

const connection = {
  url: config.REDIS_URL,
};

const defaultJobOptions: JobsOptions = {
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
};

let betStatusQueue: Queue<BetStatusJobData> | null = null;
let payoutResolveBetQueue: Queue<PayoutResolveBetJobData> | null = null;
let payoutVoteQueue: Queue<PayoutVoteJobData> | null = null;
let analyticsRefreshQueue: Queue<AnalyticsRefreshJobData> | null = null;

export function getBetStatusQueue(): Queue<BetStatusJobData> {
  if (!betStatusQueue) {
    betStatusQueue = new Queue(BET_STATUS_QUEUE, {
      connection,
      defaultJobOptions,
    });
  }
  return betStatusQueue;
}

export function getPayoutResolveBetQueue(): Queue<PayoutResolveBetJobData> {
  if (!payoutResolveBetQueue) {
    payoutResolveBetQueue = new Queue(PAYOUT_RESOLVE_BET_QUEUE, {
      connection,
      defaultJobOptions,
    });
  }
  return payoutResolveBetQueue;
}

export function getPayoutVoteQueue(): Queue<PayoutVoteJobData> {
  if (!payoutVoteQueue) {
    payoutVoteQueue = new Queue(PAYOUT_VOTE_QUEUE, {
      connection,
      defaultJobOptions,
    });
  }
  return payoutVoteQueue;
}

export function getAnalyticsRefreshQueue(): Queue<AnalyticsRefreshJobData> {
  if (!analyticsRefreshQueue) {
    analyticsRefreshQueue = new Queue(ANALYTICS_REFRESH_QUEUE, {
      connection,
      defaultJobOptions,
    });
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

export async function waitForQueueIdle(queue: Queue): Promise<void> {
  while (true) {
    const counts = await queue.getJobCounts("active", "waiting", "delayed");
    if (counts.active + counts.waiting + counts.delayed === 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
