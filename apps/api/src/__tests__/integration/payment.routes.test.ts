const testDbUrl = (() => {
  const url =
    process.env.DATABASE_URL ||
    "postgresql://appuser:sarradabet1234@localhost:5433/sarradabet_test";

  if (url.includes("/sarradabet") && !url.includes("/sarradabet_test")) {
    return url.replace("/sarradabet", "/sarradabet_test");
  }

  return url;
})();

process.env.DATABASE_URL = testDbUrl;
process.env.JWT_SECRET = "test-secret";
process.env.MERCADOPAGO_WEBHOOK_SECRET = "test-webhook-secret";

import { createHmac } from "crypto";
import { PrismaClient, PixPaymentStatus, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../../app";
import {
  authHeader,
  checkDatabaseConnection,
  cleanupAuthData,
  createTestUser,
  testIfDbAvailable,
} from "../helpers/authTestHelper";

let prisma: PrismaClient | null = null;
let isDatabaseAvailable = false;

function buildWebhookSignature(dataId: string, requestId: string, ts: string) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", "test-webhook-secret")
    .update(manifest)
    .digest("hex");
  return { "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId };
}

describe("Payment webhook routes", () => {
  beforeAll(async () => {
    isDatabaseAvailable = await checkDatabaseConnection(testDbUrl);
    if (!isDatabaseAvailable) return;

    prisma = new PrismaClient({
      datasources: { db: { url: testDbUrl } },
    });
    await cleanupAuthData(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
      prisma = null;
    }
  });

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should reject webhook with invalid signature",
    async () => {
      const response = await request(app)
        .post("/api/v1/webhooks/mercadopago")
        .set("x-signature", "ts=1,v1=invalid")
        .set("x-request-id", "req-invalid")
        .send({ type: "payment", data: { id: "123" } })
        .expect(401);

      expect(response.body.success).toBe(false);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should accept valid webhook for already approved payment idempotently",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "webhookuser",
        email: "webhookuser@example.com",
        phone: "5511999991212",
      });

      const coinPackage = await prisma.coinPackage.create({
        data: {
          name: "Webhook Package",
          amountCents: 500,
          coinsAmount: 100,
          isActive: true,
        },
      });

      const payment = await prisma.pixPayment.create({
        data: {
          userId: user.id,
          coinPackageId: coinPackage.id,
          amountCents: 500,
          coinsAmount: 100,
          status: PixPaymentStatus.APPROVED,
          externalId: "mp_webhook_approved",
          expiresAt: new Date(Date.now() + 60_000),
          idempotencyKey: "webhook-approved-key",
          paidAt: new Date(),
        },
      });

      const headers = buildWebhookSignature(
        payment.externalId,
        "req-approved",
        "1700000000",
      );

      const response = await request(app)
        .post("/api/v1/webhooks/mercadopago")
        .set(headers)
        .send({ type: "payment", data: { id: payment.externalId } })
        .expect(200);

      expect(response.body.received).toBe(true);

      const txCount = await prisma.coinTransaction.count({
        where: { userId: user.id },
      });
      expect(txCount).toBe(0);
    },
  );
});

describe("Payment routes auth", () => {
  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should require authentication to create pix purchase",
    async () => {
      const response = await request(app)
        .post("/api/v1/payments/pix")
        .send({ coinPackageId: 1 })
        .expect(401);

      expect(response.body.success).toBe(false);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should reject inactive package purchase",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "payuser",
        email: "payuser@example.com",
        phone: "5511999991313",
      });

      const inactivePackage = await prisma.coinPackage.create({
        data: {
          name: "Inactive",
          amountCents: 500,
          coinsAmount: 100,
          isActive: false,
        },
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: user.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const response = await request(app)
        .post("/api/v1/payments/pix")
        .set(authHeader(token))
        .send({ coinPackageId: inactivePackage.id })
        .expect(404);

      expect(response.body.success).toBe(false);
    },
  );
});
