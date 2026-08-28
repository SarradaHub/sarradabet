import { Worker, type Job } from "bullmq";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import {
  BET_STATUS_QUEUE,
  PAYOUT_RESOLVE_BET_QUEUE,
  PAYOUT_VOTE_QUEUE,
  ANALYTICS_REFRESH_QUEUE,
  getBetStatusQueue,
  getPayoutResolveBetQueue,
  getPayoutVoteQueue,
  getAnalyticsRefreshQueue,
  closeAllQueues,
  waitForQueueIdle,
  type PayoutResolveBetJobData,
  type PayoutVoteJobData,
} from "./queues";
import { runBetStatusTransitions } from "./bet-status.worker";
import {
  processPayoutResolveBetJob,
  processPayoutVoteJob,
} from "./payout.worker";
import { refreshAnalyticsMaterializedViews } from "./refresh-analytics.job";

const BET_STATUS_REPEAT_MS = 60_000;
const ANALYTICS_REFRESH_REPEAT_MS = 60 * 60 * 1000;

const workerConnection = {
  url: config.REDIS_URL,
};

let workers: Worker[] = [];

export function startJobWorkers(): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const betStatusQueue = getBetStatusQueue();
  workers.push(
    new Worker(BET_STATUS_QUEUE, async () => runBetStatusTransitions(), {
      connection: workerConnection,
    }),
  );
  void betStatusQueue.add(
    "tick",
    {},
    { repeat: { every: BET_STATUS_REPEAT_MS } },
  );
  void betStatusQueue.add("boot-tick", {}).catch((error: unknown) => {
    logger.error("Failed to enqueue initial bet status tick", { error });
  });

  workers.push(
    new Worker(
      PAYOUT_RESOLVE_BET_QUEUE,
      async (job: Job<PayoutResolveBetJobData>) =>
        processPayoutResolveBetJob(job.data),
      { connection: workerConnection },
    ),
  );

  workers.push(
    new Worker(
      PAYOUT_VOTE_QUEUE,
      async (job: Job<PayoutVoteJobData>) => processPayoutVoteJob(job.data),
      { connection: workerConnection },
    ),
  );

  const analyticsRefreshQueue = getAnalyticsRefreshQueue();
  workers.push(
    new Worker(
      ANALYTICS_REFRESH_QUEUE,
      async () => refreshAnalyticsMaterializedViews(),
      { connection: workerConnection },
    ),
  );
  void analyticsRefreshQueue.add(
    "tick",
    {},
    { repeat: { every: ANALYTICS_REFRESH_REPEAT_MS } },
  );

  logger.info("Background job workers started");
}

export async function shutdownJobWorkers(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  workers = [];
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

  await Promise.all([
    waitForQueueIdle(getPayoutResolveBetQueue()),
    waitForQueueIdle(getPayoutVoteQueue()),
  ]);
}
