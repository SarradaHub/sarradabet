import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  requireUserRole,
} from "../../../core/middleware/AuthMiddleware";
import {
  validateBody,
  validateParams,
} from "../../../core/middleware/ValidationMiddleware";
import {
  AdjustCoinsSchema,
  ParamIdSchema,
} from "../../../core/validation/ValidationSchemas";
import { AdminCoinController } from "../controllers/AdminCoinController";

const adminCoinController = new AdminCoinController();

const router = Router();

router.use(authenticateUser, requireUserRole(UserRole.ADMIN));

router.post(
  "/:id/coins/adjust",
  validateParams(ParamIdSchema),
  validateBody(AdjustCoinsSchema),
  adminCoinController.adjust,
);

export default router;
