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

describe("Reward Routes", () => {
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
      await prisma.userStats.deleteMany();
      await prisma.$disconnect();
      prisma = null;
    }
  });

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should create, list, redeem, and validate rewards",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "rewardadmin",
        email: "rewardadmin@example.com",
        phone: "5511999995555",
        role: UserRole.ADMIN,
      });

      const player = await createTestUser(prisma, {
        username: "rewardplayer",
        email: "rewardplayer@example.com",
        phone: "5511999994444",
      });

      await prisma.user.update({
        where: { id: player.id },
        data: { coinBalance: 1500 },
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
          title: "Camisa Oficial",
          description: "Camisa autografada",
          coinCost: 1000,
          stock: 5,
        })
        .expect(201);

      const rewardId = createResponse.body.data.id as number;

      const listResponse = await request(app)
        .get("/api/v1/rewards")
        .expect(200);

      expect(listResponse.body.data).toHaveLength(1);

      const redeemResponse = await request(app)
        .post(`/api/v1/rewards/${rewardId}/redeem`)
        .set(authHeader(playerToken))
        .expect(201);

      const ticketCode = redeemResponse.body.data.ticketCode as string;
      expect(ticketCode).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(redeemResponse.body.data.newBalance).toBe(500);

      const validateResponse = await request(app)
        .post(`/api/v1/admin/rewards/tickets/${ticketCode}/validate`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(validateResponse.body).toMatchObject({
        message: "Ticket validado com sucesso",
        data: { valid: true },
      });

      await request(app)
        .post(`/api/v1/admin/rewards/tickets/${ticketCode}/validate`)
        .set(authHeader(adminToken))
        .expect(409);
    },
  );
});
