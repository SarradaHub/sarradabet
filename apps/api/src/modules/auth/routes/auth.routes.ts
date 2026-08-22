import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { validateBody } from "../../../core/middleware/ValidationMiddleware";
import { authenticateUser } from "../../../core/middleware/AuthMiddleware";
import { createRateLimit } from "../../../core/middleware/SecurityMiddleware";
import { csrfTokenHandler } from "../../../core/middleware/CsrfMiddleware";
import { config } from "../../../config/env";
import {
  RegisterUserSchema,
  UserLoginSchema,
} from "../../../core/validation/ValidationSchemas";

const router = Router();
const authController = new AuthController();

const isTestEnv = config.NODE_ENV === "test";

const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 10_000 : config.AUTH_LOGIN_RATE_LIMIT_MAX,
  message: "Muitas tentativas de login. Tente mais tarde.",
  skipSuccessfulRequests: false,
});

const registerRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 10_000 : config.AUTH_REGISTER_RATE_LIMIT_MAX,
  message: "Muitas tentativas de cadastro. Tente mais tarde.",
  skipSuccessfulRequests: false,
});

router.get("/csrf-token", csrfTokenHandler);

router.post(
  "/register",
  registerRateLimit,
  validateBody(RegisterUserSchema),
  authController.register,
);

router.post(
  "/login",
  loginRateLimit,
  validateBody(UserLoginSchema),
  authController.login,
);

router.post("/refresh", authController.refresh);

router.post("/logout", authController.logout);

router.get("/me", authenticateUser, authController.getMe);

export default router;
