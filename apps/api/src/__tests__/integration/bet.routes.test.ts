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
import { hashPassword } from "../../utils/auth";
import {
  authHeader,
  checkDatabaseConnection,
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
    await prisma.coinTransaction.deleteMany();
    await prisma.odd.deleteMany();
    await prisma.bet.deleteMany();
    await prisma.category.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

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

    const user = await prisma.user.create({
      data: {
        username: "betcreator",
        email: "betcreator@example.com",
        phone: "5511988880001",
        passwordHash: await hashPassword("password123"),
        coinBalance: 1000,
      },
    });

    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        username: user.username,
        password: "password123",
      });

    userAccessToken = loginResponse.body.data.accessToken.token;

    const admin = await prisma.user.create({
      data: {
        username: "betadmin",
        email: "betadmin@example.com",
        phone: "5511988880002",
        passwordHash: await hashPassword("password123"),
        role: UserRole.ADMIN,
      },
    });

    const adminLoginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        username: admin.username,
        password: "password123",
      });

    adminAccessToken = adminLoginResponse.body.data.accessToken.token;
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
        for (const bet of response.body.data) {
          expect(bet.status).toBe("open");
        }
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should filter bets by comma-separated statuses",
      async () => {
        const response = await request(app)
          .get("/api/v1/bets")
          .query({ status: "open,scheduled" })
          .expect(200);

        expect(response.body.success).toBe(true);
        for (const bet of response.body.data) {
          expect(["open", "scheduled"]).toContain(bet.status);
        }
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should exclude expired open bets when excludeExpired=true",
      async () => {
        const past = new Date(Date.now() - 60 * 60_000).toISOString();
        const createResponse = await request(app)
          .post("/api/v1/bets")
          .set(authHeader(userAccessToken))
          .send({
            title: "Expired Open Filter Test",
            categoryId: testCategoryId,
            closesAt: past,
            odds: [{ title: "A" }, { title: "B" }],
          })
          .expect(201);

        const expiredBetId = createResponse.body.data.bet.id;

        const response = await request(app)
          .get("/api/v1/bets")
          .query({ status: "open", excludeExpired: "true" })
          .expect(200);

        const ids = response.body.data.map((bet: { id: number }) => bet.id);
        expect(ids).not.toContain(expiredBetId);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return resolution queue bets",
      async () => {
        const past = new Date(Date.now() - 60 * 60_000).toISOString();
        const createResponse = await request(app)
          .post("/api/v1/bets")
          .set(authHeader(userAccessToken))
          .send({
            title: "Resolution Queue Test",
            categoryId: testCategoryId,
            closesAt: past,
            odds: [{ title: "A" }, { title: "B" }],
          })
          .expect(201);

        const queuedBetId = createResponse.body.data.bet.id;

        const response = await request(app)
          .get("/api/v1/bets")
          .query({ queue: "resolution" })
          .expect(200);

        const ids = response.body.data.map((bet: { id: number }) => bet.id);
        expect(ids).toContain(queuedBetId);
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
      "should return 401 when creating bet without auth",
      async () => {
        const betData = {
          title: "Unauthorized Bet",
          description: "Should fail",
          categoryId: testCategoryId,
          odds: [{ title: "Option 1" }, { title: "Option 2" }],
        };

        const response = await request(app)
          .post("/api/v1/bets")
          .send(betData)
          .expect(401);

        expect(response.body.success).toBe(false);
      },
    );

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
        expect(response.body.data.bet.odds[0].value).toBe(1.5);
        expect(response.body.data.bet.odds[1].value).toBe(1.5);
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
            status: "closed",
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
      "should credit house takeout when resolving a bet with stakes",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Takeout Resolve Bet",
            categoryId: testCategoryId,
            status: "closed",
            odds: {
              create: [
                { title: "Home", value: 2.0 },
                { title: "Away", value: 2.0 },
              ],
            },
          },
          include: { odds: true },
        });

        const bettor = await prisma!.user.findUnique({
          where: { username: "betcreator" },
        });

        await prisma!.vote.create({
          data: {
            oddId: bet.odds[0].id,
            userId: bettor!.id,
            amount: 200,
          },
        });
        await prisma!.vote.create({
          data: {
            oddId: bet.odds[1].id,
            userId: bettor!.id,
            amount: 200,
          },
        });

        await request(app)
          .patch(`/api/v1/bets/${bet.id}/resolve`)
          .set(authHeader(adminAccessToken))
          .send({ winningOddId: bet.odds[0].id })
          .expect(200);

        const house = await prisma!.user.findUnique({
          where: { username: "house" },
        });
        expect(house?.coinBalance).toBe(100);

        const takeoutTx = await prisma!.coinTransaction.findUnique({
          where: { externalId: `takeout:bet:${bet.id}` },
        });
        expect(takeoutTx?.source).toBe("TAKEOUT");
        expect(takeoutTx?.amount).toBe(100);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 400 for invalid winning odd",
      async () => {
        await request(app)
          .patch(`/api/v1/bets/${testBetId}/close`)
          .set(authHeader(adminAccessToken))
          .expect(200);

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
      "should resolve an expired open bet by auto-closing first",
      async () => {
        const past = new Date(Date.now() - 60 * 60_000);
        const bet = await prisma!.bet.create({
          data: {
            title: "Expired Open Resolve Bet",
            categoryId: testCategoryId,
            status: "open",
            closesAt: past,
            odds: {
              create: [
                { title: "Winner", value: 2.0 },
                { title: "Loser", value: 3.0 },
              ],
            },
          },
          include: { odds: true },
        });

        const response = await request(app)
          .patch(`/api/v1/bets/${bet.id}/resolve`)
          .set(authHeader(adminAccessToken))
          .send({ winningOddId: bet.odds[0].id })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bet.status).toBe("resolved");

        const updatedBet = await prisma!.bet.findUnique({
          where: { id: bet.id },
        });
        expect(updatedBet?.status).toBe("resolved");
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
        expect(response.body.message).toContain("Aposta já foi resolvida");
      },
    );
  });

  describe("GET /api/v1/admin/house/summary", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return house treasury summary for admin",
      async () => {
        const response = await request(app)
          .get("/api/v1/admin/house/summary")
          .set(authHeader(adminAccessToken))
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(
          expect.objectContaining({
            balance: expect.any(Number),
            takeoutRate: 0.25,
            takeoutPercent: 25,
          }),
        );
      },
    );
  });

  describe("POST /api/v1/votes", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should recalculate odds after staking vote",
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

        await prisma!.user.update({
          where: { username: "betcreator" },
          data: { coinBalance: 1000 },
        });

        const firstVote = await request(app)
          .post("/api/v1/votes")
          .set(authHeader(userAccessToken))
          .send({ oddId: homeOdd.id, amount: 100 })
          .expect(201);

        expect(firstVote.body.success).toBe(true);
        expect(firstVote.body.data.odds).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: homeOdd.id,
              totalVotes: 1,
              totalStake: 100,
            }),
            expect.objectContaining({
              id: awayOdd.id,
              totalVotes: 0,
              totalStake: 0,
            }),
          ]),
        );

        const userAfterFirst = await prisma!.user.findUnique({
          where: { username: "betcreator" },
        });
        expect(userAfterFirst?.coinBalance).toBe(900);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 409 when voting on a scheduled bet",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Scheduled Vote Bet",
            categoryId: testCategoryId,
            status: "scheduled",
            startTime: new Date(Date.now() + 60 * 60 * 1000),
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
          .set(authHeader(userAccessToken))
          .send({ oddId: bet.odds[0].id, amount: 100 })
          .expect(409);

        expect(response.body.message).toContain(
          "Aposta ainda não está aberta para votos",
        );
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
          .set(authHeader(userAccessToken))
          .send({ oddId: bet.odds[0].id, amount: 100 })
          .expect(409);

        expect(response.body.message).toContain("Aposta está fechada");
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should require authentication",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Auth Vote Bet",
            categoryId: testCategoryId,
            odds: {
              create: [
                { title: "Yes", value: 2.0 },
                { title: "No", value: 2.0 },
              ],
            },
          },
          include: { odds: true },
        });

        await request(app)
          .post("/api/v1/votes")
          .send({ oddId: bet.odds[0].id, amount: 100 })
          .expect(401);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 400 when user has insufficient balance",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Insufficient Balance Bet",
            categoryId: testCategoryId,
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
          .set(authHeader(userAccessToken))
          .send({ oddId: bet.odds[0].id, amount: 5000 })
          .expect(400);

        expect(response.body.message).toContain("Saldo insuficiente");
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should allow multiple tickets on the same odd and multiple outcomes on one bet",
      async () => {
        const bet = await prisma!.bet.create({
          data: {
            title: "Multi Outcome Bet",
            categoryId: testCategoryId,
            odds: {
              create: [
                { title: "Team A", value: 2.0 },
                { title: "Team B", value: 2.0 },
              ],
            },
          },
          include: { odds: true },
        });

        const [teamA, teamB] = bet.odds;

        await request(app)
          .post("/api/v1/votes")
          .set(authHeader(userAccessToken))
          .send({ oddId: teamA.id, amount: 50 })
          .expect(201);

        await request(app)
          .post("/api/v1/votes")
          .set(authHeader(userAccessToken))
          .send({ oddId: teamA.id, amount: 100 })
          .expect(201);

        const secondOutcome = await request(app)
          .post("/api/v1/votes")
          .set(authHeader(userAccessToken))
          .send({ oddId: teamB.id, amount: 75 })
          .expect(201);

        expect(secondOutcome.body.success).toBe(true);

        const bettor = await prisma!.user.findUnique({
          where: { username: "betcreator" },
        });
        const votesOnA = await prisma!.vote.count({
          where: { userId: bettor!.id, oddId: teamA.id },
        });
        const votesOnB = await prisma!.vote.count({
          where: { userId: bettor!.id, oddId: teamB.id },
        });

        expect(votesOnA).toBe(2);
        expect(votesOnB).toBe(1);
      },
    );
  });

  describe("POST /api/v1/bets/close-batch", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should close multiple open bets",
      async () => {
        const betA = await prisma!.bet.create({
          data: {
            title: "Batch Close A",
            categoryId: testCategoryId,
            status: "open",
            odds: {
              create: [{ title: "Option 1", value: 2.0 }],
            },
          },
        });

        const betB = await prisma!.bet.create({
          data: {
            title: "Batch Close B",
            categoryId: testCategoryId,
            status: "open",
            odds: {
              create: [{ title: "Option 1", value: 2.0 }],
            },
          },
        });

        const response = await request(app)
          .post("/api/v1/bets/close-batch")
          .set(authHeader(adminAccessToken))
          .send({ ids: [betA.id, betB.id] })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.closed).toHaveLength(2);

        const closedA = await prisma!.bet.findUnique({ where: { id: betA.id } });
        const closedB = await prisma!.bet.findUnique({ where: { id: betB.id } });
        expect(closedA?.status).toBe("closed");
        expect(closedB?.status).toBe("closed");
      },
    );
  });

  describe("POST /api/v1/jobs/bet-status/run", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should transition scheduled to open and open to closed",
      async () => {
        const past = new Date(Date.now() - 60_000);
        const future = new Date(Date.now() + 60 * 60_000);

        const scheduledBet = await prisma!.bet.create({
          data: {
            title: "Scheduled Job Bet",
            categoryId: testCategoryId,
            status: "scheduled",
            startTime: past,
            closesAt: future,
            odds: {
              create: [
                { title: "A", value: 2.0 },
                { title: "B", value: 2.0 },
              ],
            },
          },
        });

        const closingBet = await prisma!.bet.create({
          data: {
            title: "Closing Job Bet",
            categoryId: testCategoryId,
            status: "open",
            startTime: new Date(Date.now() - 120_000),
            closesAt: past,
            odds: {
              create: [
                { title: "A", value: 2.0 },
                { title: "B", value: 2.0 },
              ],
            },
          },
        });

        const futureBet = await prisma!.bet.create({
          data: {
            title: "Future Job Bet",
            categoryId: testCategoryId,
            status: "scheduled",
            startTime: future,
            closesAt: new Date(Date.now() + 120 * 60_000),
            odds: {
              create: [
                { title: "A", value: 2.0 },
                { title: "B", value: 2.0 },
              ],
            },
          },
        });

        const response = await request(app)
          .post("/api/v1/jobs/bet-status/run")
          .set(authHeader(adminAccessToken))
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.opened).toBeGreaterThanOrEqual(1);
        expect(response.body.data.closed).toBeGreaterThanOrEqual(1);

        const opened = await prisma!.bet.findUnique({
          where: { id: scheduledBet.id },
        });
        const closed = await prisma!.bet.findUnique({
          where: { id: closingBet.id },
        });
        const stillScheduled = await prisma!.bet.findUnique({
          where: { id: futureBet.id },
        });

        expect(opened?.status).toBe("open");
        expect(closed?.status).toBe("closed");
        expect(stillScheduled?.status).toBe("scheduled");
      },
    );
  });
});
