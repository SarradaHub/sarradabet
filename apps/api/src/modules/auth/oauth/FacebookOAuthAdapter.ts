import * as arctic from "arctic";
import { config } from "../../../config/env";
import { ExternalServiceError } from "../../../core/errors/AppError";
import type {
  OAuthAuthorizationRequest,
  OAuthProfile,
  OAuthProviderStrategy,
} from "./OAuthProviderStrategy";

interface FacebookGraphUser {
  id?: string;
  email?: string;
  name?: string;
}

export class FacebookOAuthAdapter implements OAuthProviderStrategy {
  readonly provider = "facebook" as const;

  private getClient(): arctic.Facebook {
    const clientId = config.FACEBOOK_APP_ID;
    const clientSecret = config.FACEBOOK_APP_SECRET;
    const redirectUri = config.FACEBOOK_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new ExternalServiceError(
        "Facebook OAuth",
        "Provider is not configured",
      );
    }

    return new arctic.Facebook(clientId, clientSecret, redirectUri);
  }

  createAuthorizationRequest(): OAuthAuthorizationRequest {
    const facebook = this.getClient();
    const state = arctic.generateState();
    const url = facebook.createAuthorizationURL(state, [
      "email",
      "public_profile",
    ]);

    return { url, state };
  }

  async validateCallback(code: string): Promise<OAuthProfile> {
    const facebook = this.getClient();
    const tokens = await facebook.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    const searchParams = new URLSearchParams();
    searchParams.set("access_token", accessToken);
    searchParams.set("fields", ["id", "name", "email"].join(","));

    const response = await fetch(
      `https://graph.facebook.com/me?${searchParams.toString()}`,
    );

    if (!response.ok) {
      throw new ExternalServiceError(
        "Facebook OAuth",
        "Failed to fetch user profile",
      );
    }

    const user = (await response.json()) as FacebookGraphUser;

    if (!user.id || !user.email) {
      throw new ExternalServiceError(
        "Facebook OAuth",
        "Provider profile missing required fields",
      );
    }

    return {
      provider: "facebook",
      providerAccountId: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
