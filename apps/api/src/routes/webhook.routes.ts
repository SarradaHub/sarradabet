import { NextFunction, Request, Response, Router } from "express";
import express from "express";
import {
  isOrderWebhook,
  isPaymentWebhook,
  resolveWebhookDataId,
  validateMercadoPagoWebhookSignature,
  type MercadoPagoWebhookPayload,
} from "../core/middleware/mercadopagoWebhook";
import {
  instorePaymentService,
  pixPaymentService,
} from "../modules/payment/payment.container";
import { resolveInstoreWebhookExternalId } from "../modules/payment/services/InstorePaymentService";
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

      if (!isPaymentWebhook(body) && !isOrderWebhook(body)) {
        res.status(200).json({ received: true, ignored: true });
        return;
      }

      const resourceId = resolveWebhookDataId(req.query, body);
      if (resourceId) {
        if (isOrderWebhook(body)) {
          await instorePaymentService.confirmOrder(
            resolveInstoreWebhookExternalId(resourceId),
          );
        } else {
          await pixPaymentService.confirmPayment(resourceId);
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error("Mercado Pago webhook error", error);
      next(error);
    }
  },
);

export default router;
