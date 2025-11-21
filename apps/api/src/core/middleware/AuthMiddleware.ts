import { Request, Response, NextFunction } from "express";
import {
  verifyToken,
  extractTokenFromHeader,
  AuthPayload,
} from "../../utils/auth";
import { UnauthorizedError } from "../errors/AppError";
import { identityServiceClient } from "../../services/identityService.client";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthPayload | {
      userId: number;
      email: string;
      username: string;
      role: string;
    };
  }
}

/**
 * Middleware to authenticate admin requests using Identity Service
 */
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (process.env.USE_IDENTITY_SERVICE === "true") {
      const result = await identityServiceClient.validateToken(token);
      if (result.valid && result.user) {
        req.user = {
          userId: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: result.user.role,
        };
        return next();
      }
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Authentication required"));
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      const payload = verifyToken(token);
      req.user = payload;
    }
  } catch {
    // ignore optional auth errors
  }

  next();
};

/**
 * Middleware to check if user is authenticated (for protected routes)
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }
  next();
};

/**
 * Middleware to check if user is admin (additional check)
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  next();
};
