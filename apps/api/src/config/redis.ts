import Redis from "ioredis";
import { config } from "./env";
import { logger } from "../utils/logger";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on("error", (err) => {
      logger.warn("Redis connection error", { error: err.message });
    });

    void redisClient.connect().catch((err: Error) => {
      logger.warn("Redis initial connect failed", { error: err.message });
    });

    return redisClient;
  } catch (err) {
    logger.warn("Failed to create Redis client", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
