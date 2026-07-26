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
process.env.PUBLIC_WEB_URL = "http://localhost:3002";
process.env.TICKET_IMAGE_RATE_LIMIT_MAX = "5";
process.env.NODE_ENV = "test";

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

describe("Ticket image rate limit", () => {
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
      await prisma.rewardRedemption.deleteMany();
      await prisma.reward.deleteMany();
      await prisma.$disconnect();
      prisma = null;
    }
  });

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "returns 429 after exceeding ticket image download limit",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "ratelimitadmin",
        email: "ratelimitadmin@example.com",
        phone: "5511999997777",
        role: UserRole.ADMIN,
      });

      const player = await createTestUser(prisma, {
        username: "ratelimitplayer",
        email: "ratelimitplayer@example.com",
        phone: "5511999996666",
      });

      await prisma.user.update({
        where: { id: player.id },
        data: { coinBalance: 5000 },
      });

      const adminLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: admin.username, password: "password123" })
        .expect(200);
      const adminToken = adminLogin.body.data.accessToken.token as string;

      const playerLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: player.username, password: "password123" })
        .expect(200);
      const playerToken = playerLogin.body.data.accessToken.token as string;

      const createResponse = await request(app)
        .post("/api/v1/admin/rewards")
        .set(authHeader(adminToken))
        .send({
          title: "Caneca Rate Limit",
          coinCost: 100,
          stock: 10,
        })
        .expect(201);

      const rewardId = createResponse.body.data.id as number;

      const redeemResponse = await request(app)
        .post(`/api/v1/rewards/${rewardId}/redeem`)
        .set(authHeader(playerToken))
        .expect(201);

      const ticketCode = redeemResponse.body.data.ticketCode as string;
      const imagePath = `/api/v1/rewards/tickets/${ticketCode}/image`;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await request(app)
          .get(imagePath)
          .set(authHeader(playerToken))
          .expect(200);
      }

      const limitedResponse = await request(app)
        .get(imagePath)
        .set(authHeader(playerToken))
        .expect(429);

      expect(limitedResponse.body.message).toContain(
        "Muitas requisições. Tente novamente em 60 segundos.",
      );
    },
  );
});
