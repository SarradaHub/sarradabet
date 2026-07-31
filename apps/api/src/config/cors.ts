import { config } from "./env";

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function getAllowedOrigins(): string[] {
  return config.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  if (getAllowedOrigins().includes(origin)) {
    return true;
  }

  return config.NODE_ENV === "development" && LOCALHOST_ORIGIN.test(origin);
}
