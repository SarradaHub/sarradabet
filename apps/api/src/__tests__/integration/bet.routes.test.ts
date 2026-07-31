const testDbUrl = (() => {
  const dbUrl =
    process.env.DATABASE_URL ||
    "postgresql://appuser:sarradabet1234@localhost:5433/sarradabet_test";

  if (dbUrl.includes("/sarradabet") && !dbUrl.includes("/sarradabet_test")) {
    return dbUrl.replace("/sarradabet", "/sarradabet_test");
  }

  return dbUrl;
})();

process.env.DATABASE_URL = testDbUrl;
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

import { PrismaClient, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../../app";
import {
  authHeader,
  checkDatabaseConnection,
  loginTestUser,
  testIfDbAvailable,
} from "../helpers/authTestHelper";

let prisma: PrismaClient | null = null;
let isDatabaseAvailable = false;
let testCategoryId = 0;
let testBetId = 0;
let userAccessToken = "";
let adminAccessToken = "";

describe("Bet Routes Integration Tests", () => {
  beforeAll(async () => {
    isDatabaseAvailable = await checkDatabaseConnection(testDbUrl);

    if (!isDatabaseAvailable) {
      return;
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    await prisma.vote.deleteMany();
    await prisma.odd.deleteMany();
    await prisma.bet.deleteMany();
    await prisma.category.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const userSession = await loginTestUser(prisma, {
      username: "betuser",
      email: "betuser@example.com",
      phone: "5511999990101",
    });
    userAccessToken = userSession.accessToken;

    const adminSession = await loginTestUser(prisma, {
      username: "betadmin",
      email: "betadmin@example.com",
      phone: "5511999990102",
      role: UserRole.ADMIN,
    });
    adminAccessToken = adminSession.accessToken;

    const category = await prisma.category.create({
      data: { title: "Test Category" },
    });
    testCategoryId = category.id;

    const bet = await prisma.bet.create({
      data: {
        title: "Test Bet",
        description: "Test Description",
        categoryId: testCategoryId,
        odds: {
          create: [
            { title: "Option 1", value: 2.0 },
            { title: "Option 2", value: 3.0 },
          ],
        },
      },
      include: { odds: true },
    });
    testBetId = bet.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
      prisma = null;
    }
  });

  describe("GET /api/v1/bets", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return all bets with pagination",
      async () => {
        const response = await request(app)
          .get("/api/v1/bets")
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.meta).toHaveProperty("page", 1);
        expect(response.body.meta).toHaveProperty("limit", 10);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should filter bets by status",
      async () => {
        const response = await request(app)
          .get("/api/v1/bets")
          .query({ status: "open" })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should filter bets by category",
      async () => {
        const response = await request(app)
          .get("/api/v1/bets")
          .query({ categoryId: testCategoryId })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      },
    );
  });

  describe("GET /api/v1/bets/:id", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return a specific bet",
      async () => {
        const response = await request(app)
          .get(`/api/v1/bets/${testBetId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bet).toHaveProperty("id", testBetId);
        expect(response.body.data.bet).toHaveProperty("title", "Test Bet");
        expect(response.body.data.bet).toHaveProperty("odds");
        expect(response.body.data.bet.odds).toBeInstanceOf(Array);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 404 for non-existent bet",
      async () => {
        const response = await request(app).get("/api/v1/bets/99999").expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("not found");
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 400 for invalid ID",
      async () => {
        const response = await request(app)
          .get("/api/v1/bets/invalid")
          .expect(400);

        expect(response.body.success).toBe(false);
      },
    );
  });

  describe("POST /api/v1/bets", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should create a new bet with auto-calculated odds",
      async () => {
        const betData = {
          title: "New Test Bet",
          description: "New Test Description",
          categoryId: testCategoryId,
          odds: [{ title: "New Option 1" }, { title: "New Option 2" }],
        };

        const response = await request(app)
          .post("/api/v1/bets")
          .set(authHeader(userAccessToken))
          .send(betData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bet).toHaveProperty("id");
        expect(response.body.data.bet.title).toBe(betData.title);
        expect(response.body.data.bet.odds).toHaveLength(2);
        expect(response.body.data.bet.odds[0].value).toBe(2);
        expect(response.body.data.bet.odds[1].value).toBe(2);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 400 for invalid bet data",
      async () => {
        const invalidBetData = {
          title: "",
          categoryId: testCategoryId,
          odds: [],
        };

        const response = await request(app)
          .post("/api/v1/bets")
          .set(authHeader(userAccessToken))
          .send(invalidBetData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeInstanceOf(Array);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 400 when fewer than 2 odds are provided",
      async () => {
        const invalidBetData = {
          title: "Test Bet",
          categoryId: testCategoryId,
          odds: [{ title: "Only Option" }],
        };

        const response = await request(app)
          .post("/api/v1/bets")
          .set(authHeader(userAccessToken))
          .send(invalidBetData)
          .expect(400);

        expect(response.body.success).toBe(false);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 404 for non-existent category",
      async () => {
        const betData = {
          title: "Test Bet",
          categoryId: 99999,
          odds: [{ title: "Option 1" }, { title: "Option 2" }],
        };

        const response = await request(app)
          .post("/api/v1/bets")
          .set(authHeader(userAccessToken))
          .send(betData)
          .expect(404);

        expect(response.body.success).toBe(false);
      },
    );
  });

  describe("PUT /api/v1/bets/:id", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should update a bet",
      async () => {
        const updateData = {
          title: "Updated Bet Title",
          description: "Updated Description",
        };

        const response = await request(app)
          .put(`/api/v1/bets/${testBetId}`)
          .set(authHeader(adminAccessToken))
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bet.title).toBe(updateData.title);
        expect(response.body.data.bet.description).toBe(updateData.description);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 404 for non-existent bet",
      async () => {
        const updateData = { title: "Updated Title" };

        const response = await request(app)
          .put("/api/v1/bets/99999")
          .set(authHeader(adminAccessToken))
          .send(updateData)
          .expect(404);

        expect(response.body.success).toBe(false);
      },
    );
  });

  describe("DELETE /api/v1/bets/:id", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should delete a bet",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Bet to Delete",
            categoryId: testCategoryId,
            odds: {
              create: [{ title: "Option 1", value: 2.0 }],
            },
          },
        });

        const response = await request(app)
          .delete(`/api/v1/bets/${bet.id}`)
          .set(authHeader(adminAccessToken))
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain("deleted successfully");

        const deletedBet = await prisma!.bet.findUnique({
          where: { id: bet.id },
        });
        expect(deletedBet).toBeNull();
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 404 for non-existent bet",
      async () => {
        const response = await request(app)
          .delete("/api/v1/bets/99999")
          .set(authHeader(adminAccessToken))
          .expect(404);

        expect(response.body.success).toBe(false);
      },
    );
  });

  describe("PATCH /api/v1/bets/:id/close", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should close a bet",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Bet to Close",
            categoryId: testCategoryId,
            status: "open",
            odds: {
              create: [{ title: "Option 1", value: 2.0 }],
            },
          },
        });

        const response = await request(app)
          .patch(`/api/v1/bets/${bet.id}/close`)
          .set(authHeader(adminAccessToken))
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bet.status).toBe("closed");

        const closedBet = await prisma!.bet.findUnique({
          where: { id: bet.id },
        });
        expect(closedBet?.status).toBe("closed");
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 409 when trying to close a non-open bet",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Already Closed Bet",
            categoryId: testCategoryId,
            status: "closed",
            odds: {
              create: [{ title: "Option 1", value: 2.0 }],
            },
          },
        });

        const response = await request(app)
          .patch(`/api/v1/bets/${bet.id}/close`)
          .set(authHeader(adminAccessToken))
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Only open bets can be closed");
      },
    );
  });

  describe("PATCH /api/v1/bets/:id/resolve", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should resolve a bet",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Bet to Resolve",
            categoryId: testCategoryId,
            status: "open",
            odds: {
              create: [
                { title: "Winning Option", value: 2.0 },
                { title: "Losing Option", value: 3.0 },
              ],
            },
          },
          include: { odds: true },
        });

        const firstOdd = await prisma!.odd.findFirst({
          where: { betId: bet.id },
        });
        const response = await request(app)
          .patch(`/api/v1/bets/${bet.id}/resolve`)
          .set(authHeader(adminAccessToken))
          .send({ winningOddId: firstOdd ? firstOdd.id : -1 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bet.status).toBe("resolved");

        const updatedOdds = await prisma!.odd.findMany({
          where: { betId: bet.id },
          orderBy: { id: "asc" },
        });
        expect(updatedOdds[0]?.result).toBe("won");
        expect(updatedOdds[1]?.result).toBe("lost");
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 400 for invalid winning odd",
      async () => {
        const response = await request(app)
          .patch(`/api/v1/bets/${testBetId}/resolve`)
          .set(authHeader(adminAccessToken))
          .send({ winningOddId: 99999 })
          .expect(400);

        expect(response.body.success).toBe(false);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 409 when trying to resolve an already resolved bet",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Already Resolved Bet",
            categoryId: testCategoryId,
            status: "resolved",
            odds: {
              create: [{ title: "Option 1", value: 2.0 }],
            },
          },
        });

        const firstOdd = await prisma!.odd.findFirst({
          where: { betId: bet.id },
        });
        const response = await request(app)
          .patch(`/api/v1/bets/${bet.id}/resolve`)
          .set(authHeader(adminAccessToken))
          .send({ winningOddId: firstOdd!.id })
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("already resolved");
      },
    );
  });

  describe("POST /api/v1/votes", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should recalculate odds after voting",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Vote Odds Bet",
            categoryId: testCategoryId,
            odds: {
              create: [
                { title: "Home", value: 2.0 },
                { title: "Away", value: 2.0 },
              ],
            },
          },
          include: { odds: true },
        });

        const homeOdd = bet.odds[0];
        const awayOdd = bet.odds[1];

        const firstVote = await request(app)
          .post("/api/v1/votes")
          .send({ oddId: homeOdd.id })
          .expect(201);

        expect(firstVote.body.success).toBe(true);
        expect(firstVote.body.data.odds).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: homeOdd.id, totalVotes: 1 }),
            expect.objectContaining({ id: awayOdd.id, totalVotes: 0 }),
          ]),
        );

        const homeAfterFirst = firstVote.body.data.odds.find(
          (odd: { id: number }) => odd.id === homeOdd.id,
        );
        const awayAfterFirst = firstVote.body.data.odds.find(
          (odd: { id: number }) => odd.id === awayOdd.id,
        );
        expect(homeAfterFirst.value).toBeLessThan(awayAfterFirst.value);

        const secondVote = await request(app)
          .post("/api/v1/votes")
          .send({ oddId: homeOdd.id })
          .expect(201);

        const homeAfterSecond = secondVote.body.data.odds.find(
          (odd: { id: number }) => odd.id === homeOdd.id,
        );
        expect(homeAfterSecond.value).toBeLessThan(homeAfterFirst.value);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 409 when voting on a closed bet",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Closed Vote Bet",
            categoryId: testCategoryId,
            status: "closed",
            odds: {
              create: [
                { title: "Yes", value: 2.0 },
                { title: "No", value: 2.0 },
              ],
            },
          },
          include: { odds: true },
        });

        const response = await request(app)
          .post("/api/v1/votes")
          .send({ oddId: bet.odds[0].id })
          .expect(409);

        expect(response.body.message).toContain("Only open bets accept votes");
      },
    );
  });
});
