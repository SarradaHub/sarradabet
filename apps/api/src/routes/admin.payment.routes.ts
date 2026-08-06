import { Router } from "express";
import { UserRole } from "@prisma/client";
import { AdminPaymentController } from "../modules/payment/controllers/AdminPaymentController";
import { adminPaymentService } from "../modules/payment/payment.container";
import {
  authenticateUser,
  requireUserRole,
} from "../core/middleware/AuthMiddleware";
import { config } from "../config/env";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../core/middleware/ValidationMiddleware";
import {
  AdminCreateInstorePaymentSchema,
  AdminPixPaymentQuerySchema,
  ParamIdSchema,
} from "../core/validation/ValidationSchemas";

const adminPaymentController = new AdminPaymentController(adminPaymentService);

const router = Router();

router.use(authenticateUser, requireUserRole(UserRole.ADMIN));

router.get(
  "/pix",
  validateQuery(AdminPixPaymentQuerySchema),
  adminPaymentController.listPayments,
);
router.get(
  "/pix/:id",
  validateParams(ParamIdSchema),
  adminPaymentController.getPaymentDetail,
);
router.post(
  "/instore",
  validateBody(AdminCreateInstorePaymentSchema),
  adminPaymentController.createInstorePurchase,
);

if (config.MERCADOPAGO_MOCK_PIX) {
  router.post(
    "/instore/:id/simulate-approval",
    validateParams(ParamIdSchema),
    adminPaymentController.simulateMockInstoreApproval,
  );
}

export default router;
