import { getRedisClient } from "../config/redis";
import { logger } from "../utils/logger";

const KEY_PREFIX = "auth:blacklist:";

/** In-memory fallback for test env or when Redis is unavailable. */
const memoryBlacklist = new Map<string, number>();

function memoryKey(jti: string): string {
  return `${KEY_PREFIX}${jti}`;
}

function purgeExpiredMemoryEntries(): void {
  const now = Date.now();
  for (const [key, expiresAt] of memoryBlacklist) {
    if (expiresAt <= now) {
      memoryBlacklist.delete(key);
    }
  }
}

export class TokenBlacklistService {
  async blacklist(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }

    const redis = getRedisClient();

    if (redis && redis.status === "ready") {
      try {
        await redis.set(`${KEY_PREFIX}${jti}`, "1", "EX", ttlSeconds);
        return;
      } catch (err) {
        logger.warn("Redis blacklist write failed, falling back to memory", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    memoryBlacklist.set(memoryKey(jti), Date.now() + ttlSeconds * 1000);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const redis = getRedisClient();

    if (redis && redis.status === "ready") {
      try {
        const result = await redis.get(`${KEY_PREFIX}${jti}`);
        return result !== null;
      } catch (err) {
        logger.warn("Redis blacklist read failed, falling back to memory", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    purgeExpiredMemoryEntries();
    const expiresAt = memoryBlacklist.get(memoryKey(jti));
    if (!expiresAt) {
      return false;
    }

    if (expiresAt <= Date.now()) {
      memoryBlacklist.delete(memoryKey(jti));
      return false;
    }

    return true;
  }

  /** Clear in-memory store between tests. */
  clearMemoryStore(): void {
    memoryBlacklist.clear();
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
