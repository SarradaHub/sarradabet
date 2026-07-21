import { createHmac, timingSafeEqual } from "crypto";
import { config } from "../../config/env";
import { UnauthorizedError } from "../../core/errors/AppError";

interface MercadoPagoWebhookHeaders {
  "x-signature"?: string;
  "x-request-id"?: string;
}

export interface MercadoPagoWebhookPayload {
  type?: string;
  action?: string;
  data?: { id?: string | number };
}

export function resolveWebhookDataId(
  query: Record<string, unknown>,
  body: MercadoPagoWebhookPayload,
): string | undefined {
  const queryDataId = query["data.id"] ?? query["data_id"];
  const rawId = queryDataId ?? body.data?.id;

  if (rawId === undefined || rawId === null || rawId === "") {
    return undefined;
  }

  return String(rawId).toLowerCase();
}

export function validateMercadoPagoWebhookSignature(
  headers: MercadoPagoWebhookHeaders,
  query: Record<string, unknown>,
  body: MercadoPagoWebhookPayload,
): void {
  const secret =
    process.env.MERCADOPAGO_WEBHOOK_SECRET ?? config.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    if (config.NODE_ENV === "production") {
      throw new UnauthorizedError("Webhook secret is not configured");
    }
    return;
  }

  const signatureHeader = headers["x-signature"];
  const requestId = headers["x-request-id"];
  const dataId = resolveWebhookDataId(query, body);

  if (!signatureHeader || !tsAndHashPresent(signatureHeader)) {
    throw new UnauthorizedError("Invalid webhook signature format");
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key.trim(), value.trim()];
    }),
  );

  const ts = parts.ts;
  const receivedHash = parts.v1;

  if (!ts || !receivedHash) {
    throw new UnauthorizedError("Invalid webhook signature format");
  }

  const manifestParts: string[] = [];
  if (dataId) {
    manifestParts.push(`id:${dataId}`);
  }
  if (requestId) {
    manifestParts.push(`request-id:${requestId}`);
  }
  manifestParts.push(`ts:${ts}`);
  const manifest = `${manifestParts.join(";")};`;

  const expectedHash = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const receivedBuffer = Buffer.from(receivedHash, "utf8");
  const expectedBuffer = Buffer.from(expectedHash, "utf8");

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    throw new UnauthorizedError("Invalid webhook signature");
  }
}

function tsAndHashPresent(signatureHeader: string): boolean {
  return signatureHeader.includes("ts=") && signatureHeader.includes("v1=");
}

export function isPaymentWebhook(body: MercadoPagoWebhookPayload): boolean {
  return body.type === "payment" || body.action?.startsWith("payment.") === true;
}
