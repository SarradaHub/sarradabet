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

import {
  PixPaymentStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import request from "supertest";
import { app } from "../../app";
import {
  authHeader,
  checkDatabaseConnection,
  cleanupAuthData,
  createTestUser,
  testIfDbAvailable,
  uniqueTestPhone,
} from "../helpers/authTestHelper";

let prisma: PrismaClient | null = null;
let isDatabaseAvailable = false;

describe("Static Pix payment routes", () => {
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
    "should create static pix purchase with instruction message",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "staticpixuser",
        email: "staticpixuser@example.com",
        phone: uniqueTestPhone(888901),
      });

      const coinPackage = await prisma.coinPackage.create({
        data: {
          name: "Static Pix Package",
          amountCents: 1000,
          coinsAmount: 100,
          isActive: true,
        },
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: user.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const createResponse = await request(app)
        .post("/api/v1/payments/pix")
        .set(authHeader(token))
        .send({ coinPackageId: coinPackage.id })
        .expect(201);

      expect(createResponse.body.data.copyPaste).toBe(
        "33a26506-c657-44ca-a331-ae7dcb256201",
      );
      expect(createResponse.body.data.instructionMessage).toContain(
        "(61) 999272342",
      );
      expect(createResponse.body.data.externalId).toMatch(/^static_/);
      expect(createResponse.body.data.status).toBe("PENDING");

      const paymentId = createResponse.body.data.paymentId as number;

      const statusResponse = await request(app)
        .get(`/api/v1/payments/pix/${paymentId}`)
        .set(authHeader(token))
        .expect(200);

      expect(statusResponse.body.data.status).toBe("PENDING");
      expect(statusResponse.body.data.instructionMessage).toContain(
        "(61) 999272342",
      );
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should forbid non-admin from listing admin pix payments",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "pixlistuser",
        email: "pixlistuser@example.com",
        phone: uniqueTestPhone(888902),
        role: UserRole.USER,
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: user.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      await request(app)
        .get("/api/v1/admin/payments/pix")
        .set(authHeader(token))
        .expect(403);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should approve pending pix payment and credit coins",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "pixadmin",
        email: "pixadmin@example.com",
        phone: uniqueTestPhone(888903),
        role: UserRole.ADMIN,
      });

      const user = await createTestUser(prisma, {
        username: "pixbuyer",
        email: "pixbuyer@example.com",
        phone: uniqueTestPhone(888904),
      });

      const coinPackage = await prisma.coinPackage.create({
        data: {
          name: "Approve Pix Package",
          amountCents: 1500,
          coinsAmount: 150,
          isActive: true,
        },
      });

      const payment = await prisma.pixPayment.create({
        data: {
          userId: user.id,
          coinPackageId: coinPackage.id,
          amountCents: 1500,
          coinsAmount: 150,
          status: PixPaymentStatus.PENDING,
          externalId: "static_test_approve",
          qrCode: "33a26506-c657-44ca-a331-ae7dcb256201",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          idempotencyKey: "static-approve-key",
        },
      });

      const adminLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: admin.username, password: "password123" })
        .expect(200);

      const adminToken = adminLogin.body.data.accessToken.token as string;

      const approveResponse = await request(app)
        .post(`/api/v1/admin/payments/pix/${payment.id}/approve`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(approveResponse.body.data.status).toBe("APPROVED");
      expect(approveResponse.body.data.coinsAmount).toBe(150);
      expect(approveResponse.body.data.newBalance).toBe(150);

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.coinBalance).toBe(150);

      const auditLog = await prisma.adminAuditLog.findFirst({
        where: {
          adminId: admin.id,
          action: "PIX_APPROVE",
          targetUserId: user.id,
        },
      });
      expect(auditLog).not.toBeNull();

      const secondApprove = await request(app)
        .post(`/api/v1/admin/payments/pix/${payment.id}/approve`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(secondApprove.body.data.status).toBe("APPROVED");
    },
  );
});
