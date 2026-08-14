import type { OAuthProvider } from "@sarradabet/types";

export interface OAuthProfile {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name?: string;
}

export interface OAuthAuthorizationRequest {
  url: URL;
  state: string;
  codeVerifier?: string;
}

export interface OAuthProviderStrategy {
  readonly provider: OAuthProvider;
  createAuthorizationRequest(): OAuthAuthorizationRequest;
  validateCallback(code: string, codeVerifier?: string): Promise<OAuthProfile>;
}
