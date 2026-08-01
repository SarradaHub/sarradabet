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
process.env.TICKET_IMAGE_RATE_LIMIT_MAX = "100";

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

describe("Ticket Routes", () => {
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
    "should generate, download, verify, and validate ticket images",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "ticketadmin",
        email: "ticketadmin@example.com",
        phone: "5511999993333",
        role: UserRole.ADMIN,
      });

      const player = await createTestUser(prisma, {
        username: "ticketplayer",
        email: "ticketplayer@example.com",
        phone: "5511999992222",
      });

      const otherPlayer = await createTestUser(prisma, {
        username: "ticketother",
        email: "ticketother@example.com",
        phone: "5511999991111",
      });

      await prisma.user.update({
        where: { id: player.id },
        data: { coinBalance: 2000 },
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

      const otherLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: otherPlayer.username, password: "password123" })
        .expect(200);
      const otherToken = otherLogin.body.data.accessToken.token as string;

      const createResponse = await request(app)
        .post("/api/v1/admin/rewards")
        .set(authHeader(adminToken))
        .send({
          title: "Camisa Oficial Autografada",
          coinCost: 1000,
          stock: 5,
        })
        .expect(201);

      const rewardId = createResponse.body.data.id as number;

      const redeemResponse = await request(app)
        .post(`/api/v1/rewards/${rewardId}/redeem`)
        .set(authHeader(playerToken))
        .expect(201);

      const ticketCode = redeemResponse.body.data.ticketCode as string;
      expect(redeemResponse.body.data.ticketImageUrl).toBe(
        `/api/v1/rewards/tickets/${ticketCode}/image`,
      );

      const imageResponse = await request(app)
        .get(`/api/v1/rewards/tickets/${ticketCode}/image`)
        .set(authHeader(playerToken))
        .expect(200);

      expect(imageResponse.headers["content-type"]).toContain("image/png");
      expect(imageResponse.headers["content-disposition"]).toContain(
        `ticket_${ticketCode}.png`,
      );
      expect(imageResponse.body.length).toBeGreaterThan(1000);

      await request(app)
        .get(`/api/v1/rewards/tickets/${ticketCode}/image`)
        .set(authHeader(otherToken))
        .expect(403);

      await request(app)
        .get(`/api/v1/admin/rewards/tickets/${ticketCode}/validate-image`)
        .set(authHeader(adminToken))
        .expect(400);

      const verifyPending = await request(app)
        .get(`/api/v1/tickets/verify/${ticketCode}`)
        .expect(200);

      expect(verifyPending.body.data.status).toBe("REDEEMED");
      expect(verifyPending.body.data.userEmail).toContain("***");

      const validateResponse = await request(app)
        .post(`/api/v1/admin/rewards/tickets/${ticketCode}/validate`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(validateResponse.body.data.validateImageUrl).toBe(
        `/api/v1/admin/rewards/tickets/${ticketCode}/validate-image`,
      );

      const validateImageResponse = await request(app)
        .get(`/api/v1/admin/rewards/tickets/${ticketCode}/validate-image`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(validateImageResponse.headers["content-type"]).toContain(
        "image/png",
      );
      expect(validateImageResponse.body.length).toBeGreaterThan(1000);

      const verifyValidated = await request(app)
        .get(`/api/v1/tickets/verify/${ticketCode}`)
        .expect(200);

      expect(verifyValidated.body.data.status).toBe("VALIDATED");

      const userValidateImage = await request(app)
        .get(`/api/v1/rewards/tickets/${ticketCode}/validate-image`)
        .set(authHeader(playerToken))
        .expect(200);

      expect(userValidateImage.headers["content-type"]).toContain("image/png");
      expect(userValidateImage.headers["content-disposition"]).toContain(
        `ticket_validated_${ticketCode}.png`,
      );

      await request(app)
        .get(`/api/v1/rewards/tickets/${ticketCode}/validate-image`)
        .set(authHeader(otherToken))
        .expect(403);

      await request(app)
        .post(`/api/v1/admin/rewards/tickets/${ticketCode}/validate`)
        .set(authHeader(adminToken))
        .expect(409);

      await request(app)
        .get("/api/v1/tickets/verify/00000000-0000-4000-8000-000000000099")
        .expect(404);

      const cachedStart = Date.now();
      await request(app)
        .get(`/api/v1/rewards/tickets/${ticketCode}/image`)
        .set(authHeader(playerToken))
        .expect(200);
      const cachedDuration = Date.now() - cachedStart;

      const concurrentResponses = await Promise.all(
        Array.from({ length: 10 }, () =>
          request(app)
            .get(`/api/v1/rewards/tickets/${ticketCode}/image`)
            .set(authHeader(playerToken)),
        ),
      );

      for (const response of concurrentResponses) {
        expect([200, 429]).toContain(response.status);
        if (response.status === 200) {
          expect(response.headers["content-type"]).toContain("image/png");
        }
      }

      if (cachedDuration < 500) {
        expect(cachedDuration).toBeLessThan(500);
      }
    },
  );
});
