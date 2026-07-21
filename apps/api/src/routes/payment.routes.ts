import { Router } from "express";
import { PaymentController } from "../modules/payment/controllers/PaymentController";
import { pixPaymentService } from "../modules/payment/payment.container";
import { authenticateUser } from "../core/middleware/AuthMiddleware";
import { config } from "../config/env";
import {
  validateBody,
  validateParams,
} from "../core/middleware/ValidationMiddleware";
import {
  CreatePixPurchaseSchema,
  ParamIdSchema,
} from "../core/validation/ValidationSchemas";

const paymentController = new PaymentController(pixPaymentService);

const router = Router();

router.post(
  "/pix",
  authenticateUser,
  validateBody(CreatePixPurchaseSchema),
  paymentController.createPixPurchase,
);
router.get(
  "/pix/:id",
  authenticateUser,
  validateParams(ParamIdSchema),
  paymentController.getPixPaymentStatus,
);

if (config.MERCADOPAGO_MOCK_PIX) {
  router.post(
    "/pix/:id/simulate-approval",
    authenticateUser,
    validateParams(ParamIdSchema),
    paymentController.simulateMockApproval,
  );
}

export default router;
