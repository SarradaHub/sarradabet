import type { OAuthProvider } from "@sarradabet/types";
import { NotFoundError } from "../../../core/errors/AppError";
import { FacebookOAuthAdapter } from "./FacebookOAuthAdapter";
import { GoogleOAuthAdapter } from "./GoogleOAuthAdapter";
import type { OAuthProviderStrategy } from "./OAuthProviderStrategy";

export function createOAuthProvider(
  provider: OAuthProvider,
): OAuthProviderStrategy {
  switch (provider) {
    case "google":
      return new GoogleOAuthAdapter();
    case "facebook":
      return new FacebookOAuthAdapter();
    default:
      throw new NotFoundError("OAuth provider", provider);
  }
}

export function parseOAuthProvider(
  value: string,
): OAuthProvider | null {
  if (value === "google" || value === "facebook") {
    return value;
  }

  return null;
}
