import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  requireUserRole,
} from "../../../core/middleware/AuthMiddleware";
import {
  validateParams,
  validateQuery,
} from "../../../core/middleware/ValidationMiddleware";
import {
  AdminPixPaymentsQuerySchema,
  ParamIdSchema,
} from "../../../core/validation/ValidationSchemas";
import { AdminPixPaymentController } from "../controllers/AdminPixPaymentController";

const adminPixPaymentController = new AdminPixPaymentController();

const router = Router();

router.use(authenticateUser, requireUserRole(UserRole.ADMIN));

router.get(
  "/",
  validateQuery(AdminPixPaymentsQuerySchema),
  adminPixPaymentController.list,
);

router.post(
  "/:id/approve",
  validateParams(ParamIdSchema),
  adminPixPaymentController.approve,
);

export default router;
