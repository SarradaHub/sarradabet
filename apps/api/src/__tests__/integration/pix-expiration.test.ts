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

import { PrismaClient, PixPaymentStatus } from "@prisma/client";
import request from "supertest";
import { app } from "../../app";
import {
  checkDatabaseConnection,
  cleanupAuthData,
  createTestUser,
  testIfDbAvailable,
} from "../helpers/authTestHelper";
import { pixPaymentService } from "../../modules/payment/payment.container";

let prisma: PrismaClient | null = null;
let isDatabaseAvailable = false;

describe("Pix expiration", () => {
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
    "should expire pending payments lazily and via job helper",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "pixuser",
        email: "pixuser@example.com",
        phone: "5511999998888",
      });

      const coinPackage = await prisma.coinPackage.create({
        data: {
          name: "Test Package",
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
          status: PixPaymentStatus.PENDING,
          externalId: "mp_test_expired",
          expiresAt: new Date(Date.now() - 60_000),
          idempotencyKey: "expired-key",
        },
      });

      const status = await pixPaymentService.getPaymentStatus(user.id, payment.id);
      expect(status.status).toBe("EXPIRED");

      await prisma.pixPayment.update({
        where: { id: payment.id },
        data: {
          status: PixPaymentStatus.PENDING,
          expiresAt: new Date(Date.now() - 60_000),
        },
      });

      await pixPaymentService.expirePendingPayments();

      const expired = await prisma.pixPayment.findUnique({
        where: { id: payment.id },
      });
      expect(expired?.status).toBe("EXPIRED");
    },
  );
});
