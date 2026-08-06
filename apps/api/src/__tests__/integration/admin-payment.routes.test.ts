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

import { PrismaClient, UserRole } from "@prisma/client";
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

describe("Admin payment routes", () => {
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
    "should allow admin to create instore payment for a user and list it",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "payadmin",
        email: "payadmin@example.com",
        phone: uniqueTestPhone(888801),
        role: UserRole.ADMIN,
      });

      const customer = await createTestUser(prisma, {
        username: "paycustomer",
        email: "paycustomer@example.com",
        phone: uniqueTestPhone(888802),
      });

      const coinPackage = await prisma.coinPackage.create({
        data: {
          name: "Admin Instore Package",
          amountCents: 1500,
          coinsAmount: 300,
          isActive: true,
        },
      });

      const adminLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: admin.username, password: "password123" })
        .expect(200);

      const adminToken = adminLogin.body.data.accessToken.token as string;

      const createResponse = await request(app)
        .post("/api/v1/admin/payments/instore")
        .set(authHeader(adminToken))
        .send({
          userId: customer.id,
          coinPackageId: coinPackage.id,
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.channel).toBe("instore");
      expect(createResponse.body.data.isMock).toBe(true);

      const paymentId = createResponse.body.data.paymentId as number;

      const listResponse = await request(app)
        .get("/api/v1/admin/payments/pix?channel=instore")
        .set(authHeader(adminToken))
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items.length).toBeGreaterThan(0);
      expect(listResponse.body.data.items[0].channel).toBe("instore");
      expect(listResponse.body.data.items[0].userId).toBe(customer.id);

      const detailResponse = await request(app)
        .get(`/api/v1/admin/payments/pix/${paymentId}`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(detailResponse.body.data.username).toBe(customer.username);
      expect(detailResponse.body.data.copyPaste).toBeTruthy();

      const approveResponse = await request(app)
        .post(`/api/v1/admin/payments/instore/${paymentId}/simulate-approval`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(approveResponse.body.data.status).toBe("APPROVED");

      const updatedCustomer = await prisma.user.findUnique({
        where: { id: customer.id },
      });
      expect(updatedCustomer?.coinBalance).toBe(300);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should reject non-admin access to admin payment routes",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "payuser",
        email: "payuser@example.com",
        phone: uniqueTestPhone(888803),
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
});
