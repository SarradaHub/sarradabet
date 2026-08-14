import crypto from "crypto";
import type { OAuthProvider } from "@sarradabet/types";
import { getRedisClient } from "../../../config/redis";
import { UnauthorizedError } from "../../../core/errors/AppError";
import { logger } from "../../../utils/logger";
import type { StoredOAuthState } from "../oauth/oauthState";
import { getOAuthStateMaxAgeMs } from "../oauth/oauthState";

const KEY_PREFIX = "oauth:state:";
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_OAUTH_PARAM_LENGTH = 512;

/** In-memory fallback for test env or when Redis is unavailable. */
const memoryStore = new Map<
  string,
  { payload: StoredOAuthState; expiresAt: number }
>();

export interface OAuthCallbackValidationResult {
  authorizationCode: string;
  storedState: StoredOAuthState;
}

function purgeExpiredMemoryEntries(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

export function isValidOAuthSessionId(value: unknown): value is string {
  return typeof value === "string" && SESSION_ID_PATTERN.test(value);
}

function parseAuthorizationCode(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_OAUTH_PARAM_LENGTH
  ) {
    throw new UnauthorizedError("Invalid OAuth authorization code");
  }

  return value;
}

function parseReturnedState(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_OAUTH_PARAM_LENGTH
  ) {
    throw new UnauthorizedError("Invalid OAuth state parameter");
  }

  return value;
}

function assertStatesMatch(expected: string, actual: string): void {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new UnauthorizedError("OAuth state mismatch");
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
    if (!isValidOAuthSessionId(sessionId)) {
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

  async validateCallbackRequest(input: {
    sessionId: unknown;
    provider: OAuthProvider;
    authorizationCode: unknown;
    returnedState: unknown;
  }): Promise<OAuthCallbackValidationResult> {
    if (!isValidOAuthSessionId(input.sessionId)) {
      throw new UnauthorizedError("Invalid OAuth callback session");
    }

    const storedState = await this.consume(input.sessionId);

    if (storedState.provider !== input.provider) {
      throw new UnauthorizedError("OAuth provider mismatch");
    }

    const authorizationCode = parseAuthorizationCode(input.authorizationCode);
    const returnedState = parseReturnedState(input.returnedState);
    assertStatesMatch(storedState.state, returnedState);

    return { authorizationCode, storedState };
  }

  /** Clear in-memory store between tests. */
  clearMemoryStore(): void {
    memoryStore.clear();
  }
}

export const oauthStateStore = new OAuthStateStore();
