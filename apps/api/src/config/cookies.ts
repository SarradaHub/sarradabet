import { config } from "./env";

export function getCookieSecure(): boolean {
  return config.COOKIE_SECURE ?? config.NODE_ENV === "production";
}

export function getCookieSameSite(): "lax" | "none" {
  // Web and API are separate sites on vercel.app (public suffix), so Lax
  // cookies are omitted from credentialed cross-origin POSTs.
  return getCookieSecure() ? "none" : "lax";
}

export function getCsrfCookieName(): string {
  return getCookieSecure()
    ? "__Host-sarradabet.x-csrf-token"
    : "x-csrf-token";
}

export function getAuthCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax" | "none";
  path: "/";
} {
  return {
    httpOnly: true,
    secure: getCookieSecure(),
    sameSite: getCookieSameSite(),
    path: "/",
  };
}
