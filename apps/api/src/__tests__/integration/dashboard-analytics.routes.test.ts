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

describe("Dashboard Routes", () => {
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
      await prisma.vote.deleteMany();
      await prisma.userStats.deleteMany();
      await prisma.$disconnect();
      prisma = null;
    }
  });

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should reject unauthenticated dashboard access",
    async () => {
      const response = await request(app).get("/api/v1/users/me/dashboard");
      expect(response.status).toBe(401);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should return dashboard payload for authenticated user",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "dashuser",
        email: "dashuser@example.com",
        phone: "5511999997777",
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { coinBalance: 120 },
      });

      await prisma.userStats.create({
        data: {
          userId: user.id,
          totalBets: 2,
          wonBets: 1,
          lostBets: 1,
          winRate: 0.5,
          rankingScore: 30,
        },
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          username: "dashuser",
          password: "password123",
        });

      const token = loginResponse.body.data.accessToken.token as string;

      const response = await request(app)
        .get("/api/v1/users/me/dashboard")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.balance).toBe(120);
      expect(response.body.data.stats.totalBets).toBe(2);
      expect(response.body.data.recentBets.pagination).toMatchObject({
        page: 1,
        limit: 10,
      });
    },
  );
});

describe("Analytics Routes", () => {
  beforeAll(async () => {
    isDatabaseAvailable = await checkDatabaseConnection(testDbUrl);
  });

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should reject unauthenticated analytics access",
    async () => {
      const response = await request(app).get(
        "/api/v1/admin/analytics/overview?startDate=2026-01-01&endDate=2026-01-31",
      );
      expect(response.status).toBe(401);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should reject non-admin analytics access",
    async () => {
      if (!prisma) {
        prisma = new PrismaClient({
          datasources: { db: { url: testDbUrl } },
        });
        await cleanupAuthData(prisma);
      }

      const user = await createTestUser(prisma, {
        username: "analyticsuser",
        email: "analyticsuser@example.com",
        phone: "5511999998888",
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          username: user.username,
          password: "password123",
        });

      const token = loginResponse.body.data.accessToken.token as string;

      const response = await request(app)
        .get(
          "/api/v1/admin/analytics/overview?startDate=2026-01-01&endDate=2026-01-31",
        )
        .set(authHeader(token));

      expect(response.status).toBe(403);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should return analytics overview for admin",
    async () => {
      if (!prisma) return;

      const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      if (!admin) {
        await createTestUser(prisma, {
          username: "analyticsadmin",
          email: "analyticsadmin@example.com",
          phone: "5511999999990",
          role: UserRole.ADMIN,
        });
      }

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          username: admin?.username ?? "analyticsadmin",
          password: "password123",
        });

      const token = loginResponse.body.data.accessToken.token as string;

      const response = await request(app)
        .get(
          "/api/v1/admin/analytics/overview?startDate=2026-01-01&endDate=2026-01-31",
        )
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        activeUsers: expect.any(Number),
        totalBets: expect.any(Number),
        totalCoinVolume: expect.any(Number),
        pixRevenue: expect.any(Number),
        averageBetsPerUser: expect.any(Number),
      });
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should reject invalid date range",
    async () => {
      if (!prisma) return;

      const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          username: admin?.username ?? "admin",
          password: "admin123",
        });

      if (loginResponse.status !== 200) return;

      const token = loginResponse.body.data.accessToken.token as string;

      const response = await request(app)
        .get(
          "/api/v1/admin/analytics/overview?startDate=2026-01-31&endDate=2026-01-01",
        )
        .set(authHeader(token));

      expect(response.status).toBe(400);
    },
  );
});
