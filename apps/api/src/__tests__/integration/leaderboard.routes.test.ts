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

describe("Leaderboard Routes", () => {
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
    "should return leaderboard entries and user stats",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "rankplayer",
        email: "rankplayer@example.com",
        phone: "5511999996666",
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { coinBalance: 200 },
      });

      await prisma.userStats.create({
        data: {
          userId: user.id,
          totalBets: 5,
          wonBets: 5,
          lostBets: 0,
          winRate: 1,
          rankingScore: 70,
        },
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: user.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const leaderboardResponse = await request(app)
        .get("/api/v1/leaderboard?limit=100")
        .expect(200);

      expect(Array.isArray(leaderboardResponse.body.data)).toBe(true);
      expect(leaderboardResponse.body.data[0]).toMatchObject({
        userId: user.id,
        username: user.username,
        rankingScore: 70,
      });

      const statsResponse = await request(app)
        .get("/api/v1/users/me/stats")
        .set(authHeader(token))
        .expect(200);

      expect(statsResponse.body.data).toMatchObject({
        userId: user.id,
        totalBets: 5,
        wonBets: 5,
        tier: "silver",
      });
    },
  );
});
