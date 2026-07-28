import { NextFunction, Request, Response, Router } from "express";
import express from "express";
import {
  isPaymentWebhook,
  resolveWebhookDataId,
  validateMercadoPagoWebhookSignature,
  type MercadoPagoWebhookPayload,
} from "../core/middleware/mercadopagoWebhook";
import { pixPaymentService } from "../modules/payment/payment.container";
import { logger } from "../utils/logger";

const router = Router();

router.post(
  "/mercadopago",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawBody = req.body as Buffer;
      const body = JSON.parse(rawBody.toString("utf8")) as MercadoPagoWebhookPayload;

      validateMercadoPagoWebhookSignature(
        {
          "x-signature": req.header("x-signature") ?? undefined,
          "x-request-id": req.header("x-request-id") ?? undefined,
        },
        req.query,
        body,
      );

      if (!isPaymentWebhook(body)) {
        res.status(200).json({ received: true, ignored: true });
        return;
      }

      const paymentId = resolveWebhookDataId(req.query, body);
      if (paymentId) {
        await pixPaymentService.confirmPayment(paymentId);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error("Mercado Pago webhook error", error);
      next(error);
    }
  },
);

export default router;
