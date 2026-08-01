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

describe("Instore payment routes", () => {
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
    "should create instore purchase and simulate mock approval",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "instoreuser",
        email: "instoreuser@example.com",
        phone: "5511999991414",
      });

      const coinPackage = await prisma.coinPackage.create({
        data: {
          name: "Instore Package",
          amountCents: 1000,
          coinsAmount: 200,
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

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.channel).toBe("instore");
      expect(createResponse.body.data.isMock).toBe(true);
      expect(createResponse.body.data.qrCode).toBeTruthy();

      const paymentId = createResponse.body.data.paymentId as number;

      const approveResponse = await request(app)
        .post(`/api/v1/payments/instore/${paymentId}/simulate-approval`)
        .set(authHeader(token))
        .expect(200);

      expect(approveResponse.body.data.status).toBe("APPROVED");

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.coinBalance).toBe(200);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should require authentication for instore purchase",
    async () => {
      const response = await request(app)
        .post("/api/v1/payments/instore")
        .send({ coinPackageId: 1 })
        .expect(401);

      expect(response.body.success).toBe(false);
    },
  );
});
