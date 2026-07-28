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

import { PrismaClient, UserRole } from "@prisma/client";
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

describe("Coin Package Admin Routes", () => {
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
    "should allow admin to create and list coin packages",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "coinadmin",
        email: "coinadmin@example.com",
        phone: "5511999997777",
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: admin.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const createResponse = await request(app)
        .post("/api/v1/admin/coin-packages")
        .set(authHeader(token))
        .send({
          name: "Pacote Premium",
          amountCents: 1000,
          coinsAmount: 220,
          isActive: true,
          sortOrder: 1,
        })
        .expect(201);

      expect(createResponse.body.data.name).toBe("Pacote Premium");

      const listResponse = await request(app)
        .get("/api/v1/admin/coin-packages")
        .set(authHeader(token))
        .expect(200);

      expect(Array.isArray(listResponse.body.data)).toBe(true);
      expect(listResponse.body.data.length).toBeGreaterThan(0);
    },
  );
});
