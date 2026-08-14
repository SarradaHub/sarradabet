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
  CoinTransactionSource,
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

describe("Admin Coin Adjust Routes", () => {
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
    "should return 401 without authentication",
    async () => {
      await request(app)
        .post("/api/v1/admin/users/1/coins/adjust")
        .send({ amount: 10, direction: "credit", reason: "Test credit" })
        .expect(401);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should return 403 for non-admin users",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "regularuser",
        email: "regularuser@example.com",
        phone: uniqueTestPhone(888801),
        role: UserRole.USER,
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: user.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      await request(app)
        .post(`/api/v1/admin/users/${user.id}/coins/adjust`)
        .set(authHeader(token))
        .send({ amount: 10, direction: "credit", reason: "Test credit" })
        .expect(403);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should credit coins and create audit log for admin",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "coinadjustadmin",
        email: "coinadjustadmin@example.com",
        phone: uniqueTestPhone(888802),
        role: UserRole.ADMIN,
      });

      const target = await createTestUser(prisma, {
        username: "cointarget",
        email: "cointarget@example.com",
        phone: uniqueTestPhone(888803),
        role: UserRole.USER,
      });

      await prisma.user.update({
        where: { id: target.id },
        data: { coinBalance: 50 },
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: admin.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const response = await request(app)
        .post(`/api/v1/admin/users/${target.id}/coins/adjust`)
        .set(authHeader(token))
        .send({
          amount: 100,
          direction: "credit",
          reason: "Promotional bonus",
        })
        .expect(200);

      expect(response.body.data.balance).toBe(150);
      expect(response.body.data.transactionId).toBeDefined();

      const updatedUser = await prisma.user.findUniqueOrThrow({
        where: { id: target.id },
      });
      expect(updatedUser.coinBalance).toBe(150);

      const transaction = await prisma.coinTransaction.findFirst({
        where: {
          id: response.body.data.transactionId,
          userId: target.id,
        },
      });
      expect(transaction?.source).toBe(CoinTransactionSource.ADMIN_ADJUSTMENT);
      expect(transaction?.description).toBe("Promotional bonus");
      expect(transaction?.referenceId).toBe(admin.id);

      const auditLog = await prisma.adminAuditLog.findFirst({
        where: { targetUserId: target.id, adminId: admin.id },
      });
      expect(auditLog).not.toBeNull();
      expect(auditLog?.action).toBe("COIN_ADJUST");
      expect(auditLog?.payload).toMatchObject({
        amount: 100,
        direction: "credit",
        reason: "Promotional bonus",
        balanceBefore: 50,
        balanceAfter: 150,
      });
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should reject debit exceeding balance without partial update",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "coinadjustadmin2",
        email: "coinadjustadmin2@example.com",
        phone: uniqueTestPhone(888804),
        role: UserRole.ADMIN,
      });

      const target = await createTestUser(prisma, {
        username: "cointarget2",
        email: "cointarget2@example.com",
        phone: uniqueTestPhone(888805),
        role: UserRole.USER,
      });

      await prisma.user.update({
        where: { id: target.id },
        data: { coinBalance: 30 },
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: admin.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      await request(app)
        .post(`/api/v1/admin/users/${target.id}/coins/adjust`)
        .set(authHeader(token))
        .send({
          amount: 50,
          direction: "debit",
          reason: "Correction for overpayment",
        })
        .expect(400);

      const updatedUser = await prisma.user.findUniqueOrThrow({
        where: { id: target.id },
      });
      expect(updatedUser.coinBalance).toBe(30);

      const auditCount = await prisma.adminAuditLog.count({
        where: { targetUserId: target.id },
      });
      expect(auditCount).toBe(0);
    },
  );
});
