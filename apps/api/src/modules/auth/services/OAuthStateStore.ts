import crypto from "crypto";
import { getRedisClient } from "../../../config/redis";
import { UnauthorizedError } from "../../../core/errors/AppError";
import { logger } from "../../../utils/logger";
import type { StoredOAuthState } from "../oauth/oauthState";
import { getOAuthStateMaxAgeMs } from "../oauth/oauthState";

const KEY_PREFIX = "oauth:state:";

/** In-memory fallback for test env or when Redis is unavailable. */
const memoryStore = new Map<
  string,
  { payload: StoredOAuthState; expiresAt: number }
>();

function purgeExpiredMemoryEntries(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

export class OAuthStateStore {
  async save(state: StoredOAuthState): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString("base64url");
    const ttlSeconds = Math.ceil(getOAuthStateMaxAgeMs() / 1000);
    const redis = getRedisClient();

    if (redis && redis.status === "ready") {
      try {
        await redis.setex(
          `${KEY_PREFIX}${sessionId}`,
          ttlSeconds,
          JSON.stringify(state),
        );
        return sessionId;
      } catch (err) {
        logger.warn("Redis OAuth state write failed, falling back to memory", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    memoryStore.set(sessionId, {
      payload: state,
      expiresAt: Date.now() + getOAuthStateMaxAgeMs(),
    });

    return sessionId;
  }

  async consume(sessionId: string): Promise<StoredOAuthState> {
    if (!sessionId) {
      throw new UnauthorizedError("Invalid OAuth state");
    }

    const redis = getRedisClient();

    if (redis && redis.status === "ready") {
      try {
        const key = `${KEY_PREFIX}${sessionId}`;
        const raw = await redis.get(key);
        if (raw) {
          await redis.del(key);
          return this.parseStoredState(raw);
        }
      } catch (err) {
        logger.warn("Redis OAuth state read failed, falling back to memory", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    purgeExpiredMemoryEntries();
    const entry = memoryStore.get(sessionId);
    memoryStore.delete(sessionId);

    if (!entry) {
      throw new UnauthorizedError("Invalid OAuth state");
    }

    if (entry.expiresAt <= Date.now()) {
      throw new UnauthorizedError("OAuth state expired");
    }

    return entry.payload;
  }

  private parseStoredState(raw: string): StoredOAuthState {
    const payload = JSON.parse(raw) as StoredOAuthState;

    if (!payload.state || !payload.provider || !payload.exp) {
      throw new UnauthorizedError("Invalid OAuth state");
    }

    if (payload.exp <= Date.now()) {
      throw new UnauthorizedError("OAuth state expired");
    }

    return payload;
  }

  /** Clear in-memory store between tests. */
  clearMemoryStore(): void {
    memoryStore.clear();
  }
}

export const oauthStateStore = new OAuthStateStore();
