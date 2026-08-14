import * as arctic from "arctic";
import { config } from "../../../config/env";
import { ExternalServiceError } from "../../../core/errors/AppError";
import type {
  OAuthAuthorizationRequest,
  OAuthProfile,
  OAuthProviderStrategy,
} from "./OAuthProviderStrategy";

export class GoogleOAuthAdapter implements OAuthProviderStrategy {
  readonly provider = "google" as const;

  private getClient(): arctic.Google {
    const clientId = config.GOOGLE_CLIENT_ID;
    const clientSecret = config.GOOGLE_CLIENT_SECRET;
    const redirectUri = config.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new ExternalServiceError(
        "Google OAuth",
        "Provider is not configured",
      );
    }

    return new arctic.Google(clientId, clientSecret, redirectUri);
  }

  createAuthorizationRequest(): OAuthAuthorizationRequest {
    const google = this.getClient();
    const state = arctic.generateState();
    const codeVerifier = arctic.generateCodeVerifier();
    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email",
    ]);

    return { url, state, codeVerifier };
  }

  async validateCallback(
    code: string,
    codeVerifier?: string,
  ): Promise<OAuthProfile> {
    if (!codeVerifier) {
      throw new ExternalServiceError(
        "Google OAuth",
        "Missing PKCE code verifier",
      );
    }

    const google = this.getClient();
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const idToken = tokens.idToken();

    if (!idToken) {
      throw new ExternalServiceError(
        "Google OAuth",
        "Missing ID token in provider response",
      );
    }

    const claims = arctic.decodeIdToken(idToken) as {
      sub?: string;
      email?: string;
      name?: string;
    };

    if (!claims.sub || !claims.email) {
      throw new ExternalServiceError(
        "Google OAuth",
        "Provider profile missing required fields",
      );
    }

    return {
      provider: "google",
      providerAccountId: claims.sub,
      email: claims.email,
      name: claims.name,
    };
  }
}
