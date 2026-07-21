import { createHmac } from "crypto";
import {
  isPaymentWebhook,
  resolveWebhookDataId,
  validateMercadoPagoWebhookSignature,
} from "../../core/middleware/mercadopagoWebhook";

describe("MercadoPago webhook validator", () => {
  const originalSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = "test-webhook-secret";
  });

  afterEach(() => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
  });

  it("accepts a valid signature from body data.id", () => {
    const ts = "1700000000";
    const requestId = "req-123";
    const dataId = "987654";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", "test-webhook-secret")
      .update(manifest)
      .digest("hex");

    expect(() =>
      validateMercadoPagoWebhookSignature(
        {
          "x-signature": `ts=${ts},v1=${v1}`,
          "x-request-id": requestId,
        },
        {},
        { type: "payment", data: { id: dataId } },
      ),
    ).not.toThrow();
  });

  it("accepts a valid signature from query data.id (lowercased)", () => {
    const ts = "1700000000";
    const requestId = "req-456";
    const dataId = "abc123";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", "test-webhook-secret")
      .update(manifest)
      .digest("hex");

    expect(() =>
      validateMercadoPagoWebhookSignature(
        {
          "x-signature": `ts=${ts},v1=${v1}`,
          "x-request-id": requestId,
        },
        { "data.id": "ABC123" },
        { type: "payment" },
      ),
    ).not.toThrow();
  });

  it("rejects an invalid signature", () => {
    expect(() =>
      validateMercadoPagoWebhookSignature(
        {
          "x-signature": "ts=1700000000,v1=invalid",
          "x-request-id": "req-123",
        },
        {},
        { type: "payment", data: { id: "987654" } },
      ),
    ).toThrow("Invalid webhook signature");
  });

  it("resolves data id from query or body", () => {
    expect(resolveWebhookDataId({ "data.id": "ABC" }, {})).toBe("abc");
    expect(resolveWebhookDataId({}, { data: { id: "XYZ" } })).toBe("xyz");
    expect(resolveWebhookDataId({}, {})).toBeUndefined();
  });

  it("identifies payment webhooks", () => {
    expect(isPaymentWebhook({ type: "payment" })).toBe(true);
    expect(isPaymentWebhook({ action: "payment.updated" })).toBe(true);
    expect(isPaymentWebhook({ type: "merchant_order" })).toBe(false);
  });
});
