import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import {
  verifyAccessToken,
  extractTokenFromHeader,
} from "../../utils/auth";
import {
  UnauthorizedError,
  ForbiddenError,
} from "../errors/AppError";
import { identityServiceClient } from "../../services/identityService.client";
import { tokenBlacklistService } from "../../services/TokenBlacklistService";

export type UserRequestUser = {
  type: "user";
  userId: number;
  email: string;
  username: string;
  role: UserRole;
};

export type RequestUser = UserRequestUser;

declare module "express-serve-static-core" {
  interface Request {
    user?: RequestUser;
  }
}

export const authenticateUser = async (
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
          type: "user",
          userId: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: result.user.role as UserRole,
        };
        return next();
      }
    }

    const payload = verifyAccessToken(token);

    if (payload.jti && (await tokenBlacklistService.isBlacklisted(payload.jti))) {
      return next(new UnauthorizedError("Token has been revoked"));
    }

    req.user = { ...payload, type: "user" };
    next();
  } catch {
    next(new UnauthorizedError("Authentication required"));
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      const payload = verifyAccessToken(token);
      req.user = { ...payload, type: "user" };
    }
  } catch {
    // ignore optional auth errors
  }

  next();
};

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

export const requireUserRole =
  (role: UserRole) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.type !== "user") {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (req.user.role !== role) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };

export const requireSelfOrAdmin =
  (paramId: string = "id") =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.type !== "user") {
      return next(new UnauthorizedError("Authentication required"));
    }

    const targetId = parseInt(req.params[paramId], 10);
    if (req.user.role !== UserRole.ADMIN && req.user.userId !== targetId) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
