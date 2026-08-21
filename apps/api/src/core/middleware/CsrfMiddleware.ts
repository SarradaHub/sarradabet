import { Request, Response, NextFunction } from "express";
import { doubleCsrf } from "csrf-csrf";
import {
  getAuthCookieOptions,
  getCsrfCookieName,
} from "../../config/cookies";
import { config } from "../../config/env";
import { ForbiddenError } from "../errors/AppError";

function getCsrfSecret(): string {
  const secret = config.JWT_SECRET ?? config.API_KEY;
  if (!secret) {
    throw new Error("JWT_SECRET or API_KEY is required for CSRF protection");
  }
  return secret;
}

function getSessionIdentifier(req: Request): string {
  const refreshToken = req.cookies?.[config.REFRESH_TOKEN_COOKIE_NAME];
  if (typeof refreshToken === "string" && refreshToken.length > 0) {
    return refreshToken;
  }

  return req.ip ?? "anonymous";
}

function shouldSkipCsrfProtection(req: Request): boolean {
  if (config.NODE_ENV === "test") {
    return true;
  }

  if (req.path.startsWith("/api/v1/webhooks")) {
    return true;
  }

  return false;
}

const {
  doubleCsrfProtection,
  generateCsrfToken,
  invalidCsrfTokenError,
} = doubleCsrf({
  getSecret: () => getCsrfSecret(),
  getSessionIdentifier,
  cookieName: getCsrfCookieName(),
  cookieOptions: getAuthCookieOptions(),
  getCsrfTokenFromRequest: (req) => {
    const headerToken = req.headers["x-csrf-token"];
    return typeof headerToken === "string" ? headerToken : undefined;
  },
  skipCsrfProtection: shouldSkipCsrfProtection,
});

export { generateCsrfToken, invalidCsrfTokenError, doubleCsrfProtection };

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  doubleCsrfProtection(req, res, (error?: unknown) => {
    if (error === invalidCsrfTokenError) {
      next(new ForbiddenError("Invalid CSRF token"));
      return;
    }

    next(error);
  });
};

export const csrfTokenHandler = (req: Request, res: Response): void => {
  const csrfToken = generateCsrfToken(req, res);
  res.status(200).json({
    success: true,
    data: { csrfToken },
  });
};
