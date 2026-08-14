import crypto from "crypto";
import { config } from "../../../config/env";
import { UnauthorizedError } from "../../../core/errors/AppError";

const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export interface StoredOAuthState {
  state: string;
  provider: string;
  codeVerifier?: string;
  exp: number;
}

function getSigningSecret(): string {
  if (!config.JWT_SECRET) {
    throw new Error("JWT_SECRET is required for OAuth state signing");
  }

  return config.JWT_SECRET;
}

function signPayload(payload: StoredOAuthState): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

function verifySignedPayload(value: string): StoredOAuthState {
  const [body, signature] = value.split(".");

  if (!body || !signature) {
    throw new UnauthorizedError("Invalid OAuth state");
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(body)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new UnauthorizedError("Invalid OAuth state");
  }

  const payload = JSON.parse(
    Buffer.from(body, "base64url").toString("utf8"),
  ) as StoredOAuthState;

  if (!payload.state || !payload.provider || !payload.exp) {
    throw new UnauthorizedError("Invalid OAuth state");
  }

  if (payload.exp <= Date.now()) {
    throw new UnauthorizedError("OAuth state expired");
  }

  return payload;
}

export function createSignedOAuthState(payload: StoredOAuthState): string {
  return signPayload(payload);
}

export function parseSignedOAuthState(value: string): StoredOAuthState {
  return verifySignedPayload(value);
}

export function getOAuthStateCookieName(): string {
  return OAUTH_STATE_COOKIE;
}

export function getOAuthStateMaxAgeMs(): number {
  return OAUTH_STATE_TTL_MS;
}

export function buildStoredOAuthState(input: {
  state: string;
  provider: string;
  codeVerifier?: string;
}): StoredOAuthState {
  return {
    state: input.state,
    provider: input.provider,
    codeVerifier: input.codeVerifier,
    exp: Date.now() + OAUTH_STATE_TTL_MS,
  };
}
