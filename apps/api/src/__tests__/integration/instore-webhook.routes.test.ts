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
process.env.MERCADOPAGO_MOCK_PIX = "true";
process.env.MERCADOPAGO_WEBHOOK_SECRET = "test-webhook-secret";

import { createHmac } from "crypto";
import { PrismaClient } from "@prisma/client";
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

function signedOrderWebhook(orderId: string) {
  const ts = "1700000000";
  const requestId = "req-order-1";
  const manifest = `id:${orderId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", "test-webhook-secret")
    .update(manifest)
    .digest("hex");

  return {
    headers: {
      "x-signature": `ts=${ts},v1=${v1}`,
      "x-request-id": requestId,
    },
    body: {
      type: "order",
      data: { id: orderId },
    },
  };
}

describe("Instore order webhook", () => {
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
    "should accept order webhook and remain idempotent after approval",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "webhookinstore",
        email: "webhookinstore@example.com",
        phone: "5511999991515",
      });

      const coinPackage = await prisma.coinPackage.create({
        data: {
          name: "Webhook Instore Package",
          amountCents: 1000,
          coinsAmount: 250,
          isActive: true,
        },
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: user.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const createResponse = await request(app)
        .post("/api/v1/payments/instore")
        .set(authHeader(token))
        .send({ coinPackageId: coinPackage.id })
        .expect(201);

      const externalId = createResponse.body.data.externalId as string;
      const gatewayOrderId = externalId.replace(/^instore_/, "");
      const paymentId = createResponse.body.data.paymentId as number;
      const webhook = signedOrderWebhook(gatewayOrderId);

      await request(app)
        .post("/api/v1/webhooks/mercadopago")
        .set(webhook.headers)
        .send(webhook.body)
        .expect(200);

      let updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.coinBalance).toBe(0);

      await request(app)
        .post(`/api/v1/payments/instore/${paymentId}/simulate-approval`)
        .set(authHeader(token))
        .expect(200);

      updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.coinBalance).toBe(250);

      await request(app)
        .post("/api/v1/webhooks/mercadopago")
        .set(webhook.headers)
        .send(webhook.body)
        .expect(200);

      updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.coinBalance).toBe(250);
    },
  );
});
