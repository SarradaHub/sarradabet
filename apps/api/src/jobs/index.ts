import { logger } from "../utils/logger";
import {
  getBetStatusQueue,
  getPayoutResolveBetQueue,
  getPayoutVoteQueue,
  getAnalyticsRefreshQueue,
  closeAllQueues,
} from "./queues";
import { runBetStatusTransitions } from "./bet-status.worker";
import {
  processPayoutResolveBetJob,
  processPayoutVoteJob,
} from "./payout.worker";
import { refreshAnalyticsMaterializedViews } from "./refresh-analytics.job";

const BET_STATUS_REPEAT_MS = 60_000;
const ANALYTICS_REFRESH_REPEAT_MS = 60 * 60 * 1000;

export function startJobWorkers(): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const betStatusQueue = getBetStatusQueue();
  betStatusQueue.process(async () => runBetStatusTransitions());
  betStatusQueue.add({}, { repeat: { every: BET_STATUS_REPEAT_MS } });

  getPayoutResolveBetQueue().process(async (job) =>
    processPayoutResolveBetJob(job.data),
  );

  getPayoutVoteQueue().process(async (job) =>
    processPayoutVoteJob(job.data),
  );

  const analyticsRefreshQueue = getAnalyticsRefreshQueue();
  analyticsRefreshQueue.process(async () =>
    refreshAnalyticsMaterializedViews(),
  );
  analyticsRefreshQueue.add({}, { repeat: { every: ANALYTICS_REFRESH_REPEAT_MS } });

  logger.info("Background job workers started");
}

export async function shutdownJobWorkers(): Promise<void> {
  await closeAllQueues();
  logger.info("Background job workers stopped");
}

export async function triggerBetStatusJobNow(): Promise<{
  opened: number;
  closed: number;
}> {
  return runBetStatusTransitions();
}

export async function triggerAnalyticsRefreshJobNow(): Promise<void> {
  return refreshAnalyticsMaterializedViews();
}

export async function drainPayoutJobs(): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const resolveQueue = getPayoutResolveBetQueue();
  const voteQueue = getPayoutVoteQueue();

  await Promise.all([
    resolveQueue.whenCurrentJobsFinished(),
    voteQueue.whenCurrentJobsFinished(),
  ]);
}
