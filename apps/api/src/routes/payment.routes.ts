import { Router } from "express";
import { PaymentController } from "../modules/payment/controllers/PaymentController";
import {
  instorePaymentService,
  pixPaymentService,
} from "../modules/payment/payment.container";
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

const paymentController = new PaymentController(
  pixPaymentService,
  instorePaymentService,
);

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

router.post(
  "/instore",
  authenticateUser,
  validateBody(CreatePixPurchaseSchema),
  paymentController.createInstorePurchase,
);
router.get(
  "/instore/:id",
  authenticateUser,
  validateParams(ParamIdSchema),
  paymentController.getInstorePaymentStatus,
);

if (config.MERCADOPAGO_MOCK_PIX) {
  router.post(
    "/pix/:id/simulate-approval",
    authenticateUser,
    validateParams(ParamIdSchema),
    paymentController.simulateMockApproval,
  );
  router.post(
    "/instore/:id/simulate-approval",
    authenticateUser,
    validateParams(ParamIdSchema),
    paymentController.simulateMockInstoreApproval,
  );
}

export default router;
