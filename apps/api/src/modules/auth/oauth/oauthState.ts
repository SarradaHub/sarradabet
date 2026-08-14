const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export interface StoredOAuthState {
  state: string;
  provider: string;
  codeVerifier?: string;
  exp: number;
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
