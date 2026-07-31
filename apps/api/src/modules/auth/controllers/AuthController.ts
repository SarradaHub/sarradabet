import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { UserService } from "../../user/services/UserService";
import { ApiResponse } from "../../../utils/api/response";
import { UnauthorizedError, AppError } from "../../../core/errors/AppError";
import { config } from "../../../config/env";
import {
  getRefreshTokenMaxAgeMs,
  extractTokenFromHeader,
  getAccessTokenRemainingTtlSeconds,
  verifyAccessToken,
} from "../../../utils/auth";
import { UserRequestUser } from "../../../core/middleware/AuthMiddleware";
import { tokenBlacklistService } from "../../../services/TokenBlacklistService";

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  private sendSuccess(
    res: Response,
    data: unknown,
    statusCode: number = 200,
  ): void {
    new ApiResponse(res).success(data as any, statusCode);
  }

  private sendError(
    res: Response,
    err: unknown,
    fallbackStatusCode: number = 400,
  ): void {
    let message = "An error occurred";
    let statusCode = fallbackStatusCode;

    if (err instanceof AppError) {
      message = err.message;
      statusCode = err.statusCode;
    } else if (err instanceof Error) {
      message = err.message;
    }

    new ApiResponse(res).error(message, undefined, statusCode);
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    const cookieSecure =
      config.COOKIE_SECURE ?? config.NODE_ENV === "production";

    res.cookie(config.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: getRefreshTokenMaxAgeMs(),
    });
  }

  private clearRefreshCookie(res: Response): void {
    const cookieSecure =
      config.COOKIE_SECURE ?? config.NODE_ENV === "production";

    res.clearCookie(config.REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      path: "/api/v1/auth",
    });
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      this.setRefreshCookie(res, result.refreshToken);

      this.sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        201,
      );
    } catch (error) {
      this.sendError(res, error);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      this.setRefreshCookie(res, result.refreshToken);

      this.sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      this.sendError(res, error);
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.[config.REFRESH_TOKEN_COOKIE_NAME];
      if (!refreshToken) {
        this.sendError(res, new UnauthorizedError("Refresh token required"), 401);
        return;
      }

      const result = await this.authService.refresh(refreshToken);
      this.setRefreshCookie(res, result.refreshToken);

      this.sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      this.clearRefreshCookie(res);
      this.sendError(res, error, 401);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const token = extractTokenFromHeader(authHeader);
          const payload = verifyAccessToken(token);
          if (payload.jti) {
            const ttlSeconds = getAccessTokenRemainingTtlSeconds(token);
            await tokenBlacklistService.blacklist(payload.jti, ttlSeconds);
          }
        } catch {
          // ignore invalid bearer on logout
        }
      }

      const refreshToken = req.cookies?.[config.REFRESH_TOKEN_COOKIE_NAME];
      await this.authService.logout(refreshToken);
      this.clearRefreshCookie(res);

      this.sendSuccess(res, { message: "Logout successful" });
    } catch (error) {
      this.sendError(res, error);
    }
  };

  getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const authUser = req.user as UserRequestUser;
      const user = await this.userService.findById(authUser.userId);
      this.sendSuccess(res, user);
    } catch (error) {
      this.sendError(res, error);
    }
  };
}
