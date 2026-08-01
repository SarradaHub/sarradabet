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

describe("Coin routes", () => {
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
    "should list active coin packages publicly",
    async () => {
      if (!prisma) return;

      await prisma.coinPackage.create({
        data: {
          name: "Pacote Coin Route",
          amountCents: 500,
          coinsAmount: 50,
          isActive: true,
        },
      });

      const response = await request(app)
        .get("/api/v1/coins/packages")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should return balance and transactions for authenticated user",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "coinrouteuser",
        email: "coinrouteuser@example.com",
        phone: "5511999991616",
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { coinBalance: 150 },
      });

      await prisma.coinTransaction.create({
        data: {
          userId: user.id,
          type: "CREDIT",
          amount: 150,
          balanceAfter: 150,
          source: "ADMIN_ADJUSTMENT",
          description: "Seed balance",
        },
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: user.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const balanceResponse = await request(app)
        .get("/api/v1/coins/balance")
        .set(authHeader(token))
        .expect(200);

      expect(balanceResponse.body.data.balance).toBe(150);

      const txResponse = await request(app)
        .get("/api/v1/coins/transactions")
        .set(authHeader(token))
        .expect(200);

      expect(txResponse.body.data.items.length).toBeGreaterThan(0);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should require auth for balance and transactions",
    async () => {
      await request(app).get("/api/v1/coins/balance").expect(401);
      await request(app).get("/api/v1/coins/transactions").expect(401);
    },
  );
});
