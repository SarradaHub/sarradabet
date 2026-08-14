import { Request, Response } from "express";
import { config } from "../../../config/env";
import {
  AppError,
  NotFoundError,
} from "../../../core/errors/AppError";
import {
  getRefreshTokenMaxAgeMs,
} from "../../../utils/auth";
import {
  createOAuthProvider,
  parseOAuthProvider,
} from "../oauth/createOAuthProvider";
import {
  buildStoredOAuthState,
  getOAuthStateCookieName,
  getOAuthStateMaxAgeMs,
} from "../oauth/oauthState";
import { OAuthService } from "../services/OAuthService";
import { oauthStateStore } from "../services/OAuthStateStore";

export class OAuthController {
  private readonly oauthService = new OAuthService();

  private setRefreshCookie(res: Response, refreshToken: string): void {
    const cookieSecure =
      config.COOKIE_SECURE ?? config.NODE_ENV === "production";

    res.cookie(config.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      path: "/",
      maxAge: getRefreshTokenMaxAgeMs(),
    });
  }

  private clearOAuthStateCookie(res: Response): void {
    const cookieSecure =
      config.COOKIE_SECURE ?? config.NODE_ENV === "production";

    res.clearCookie(getOAuthStateCookieName(), {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      path: "/",
    });
  }

  private setOAuthStateSessionCookie(
    res: Response,
    sessionId: string,
  ): void {
    const cookieSecure =
      config.COOKIE_SECURE ?? config.NODE_ENV === "production";

    res.cookie(getOAuthStateCookieName(), sessionId, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      path: "/",
      maxAge: getOAuthStateMaxAgeMs(),
    });
  }

  private redirectToError(res: Response): void {
    this.clearOAuthStateCookie(res);
    res.redirect(config.OAUTH_FRONTEND_ERROR_URL);
  }

  start = async (req: Request, res: Response): Promise<void> => {
    try {
      const provider = parseOAuthProvider(req.params.provider);
      if (!provider) {
        throw new NotFoundError("OAuth provider", req.params.provider);
      }

      const adapter = createOAuthProvider(provider);
      const authorizationRequest = adapter.createAuthorizationRequest();
      const sessionId = await oauthStateStore.save(
        buildStoredOAuthState({
          state: authorizationRequest.state,
          provider,
          codeVerifier: authorizationRequest.codeVerifier,
        }),
      );

      this.setOAuthStateSessionCookie(res, sessionId);
      res.redirect(authorizationRequest.url.toString());
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 502) {
        res.status(503).json({
          success: false,
          message: "OAuth provider is not configured",
        });
        return;
      }

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      this.redirectToError(res);
    }
  };

  callback = async (req: Request, res: Response): Promise<void> => {
    try {
      const provider = parseOAuthProvider(req.params.provider);
      if (!provider) {
        throw new NotFoundError("OAuth provider", req.params.provider);
      }

      const { authorizationCode, storedState } =
        await oauthStateStore.validateCallbackRequest({
          sessionId: req.cookies?.[getOAuthStateCookieName()],
          provider,
          authorizationCode: req.query.code,
          returnedState: req.query.state,
        });

      const adapter = createOAuthProvider(provider);
      const profile = await adapter.validateCallback(
        authorizationCode,
        storedState.codeVerifier,
      );
      const result = await this.oauthService.linkOrCreateUser(profile);

      this.clearOAuthStateCookie(res);
      this.setRefreshCookie(res, result.refreshToken);
      res.redirect(config.OAUTH_FRONTEND_SUCCESS_URL);
    } catch {
      this.redirectToError(res);
    }
  };
}
