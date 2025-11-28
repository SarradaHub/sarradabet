// Set DATABASE_URL to test database BEFORE importing app
// This ensures the app uses the test database when it initializes
const getTestDatabaseUrl = () => {
  const dbUrl =
    process.env.DATABASE_URL ||
    "postgresql://appuser:sarradabet1234@localhost:5433/sarradabet_test";
  // Replace database name with _test suffix if it doesn't already have it
  if (dbUrl.includes("/sarradabet") && !dbUrl.includes("/sarradabet_test")) {
    return dbUrl.replace("/sarradabet", "/sarradabet_test");
  }
  return dbUrl;
};

const testDbUrl = getTestDatabaseUrl();
// Set environment variable before app imports prisma
process.env.DATABASE_URL = testDbUrl;

import request from "supertest";
import { app } from "../../app";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;
let isDatabaseAvailable = false;

// Function to check database connectivity
const checkDatabaseConnection = async (): Promise<boolean> => {
  if (!testDbUrl) return false;
  
  const testClient = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl,
      },
    },
  });

  try {
    await testClient.$connect();
    await testClient.$disconnect();
    return true;
  } catch (error) {
    console.warn(
      `Database connection check failed: ${error instanceof Error ? error.message : "Unknown error"}. Integration tests will be skipped.`,
    );
    try {
      await testClient.$disconnect();
    } catch {
      // Ignore disconnect errors
    }
    return false;
  }
};

describe("Bet Routes Integration Tests", () => {
  let testCategoryId: number;
  let testBetId: number;

  beforeAll(async () => {
    // Check if database is available
    isDatabaseAvailable = await checkDatabaseConnection();
    
    if (!isDatabaseAvailable) {
      console.warn(
        "Skipping integration tests - database is not available at " + testDbUrl,
      );
      return;
    }

    // Initialize Prisma client only if database is available
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    // Clean up test database using Prisma to avoid table name/case issues
    await prisma.vote.deleteMany();
    await prisma.odd.deleteMany();
    await prisma.bet.deleteMany();
    await prisma.category.deleteMany();

    // Create test category
    const category = await prisma.category.create({
      data: { title: "Test Category" },
    });
    testCategoryId = category.id;

    // Create test bet
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

  // Helper to conditionally run tests based on database availability
  const testIfDbAvailable = (
    name: string,
    fn?: jest.ProvidesCallback,
  ) => {
    if (isDatabaseAvailable) {
      return it(name, fn);
    } else {
      return it.skip(name, fn);
    }
  };

  describe("GET /api/v1/bets", () => {
    testIfDbAvailable("should return all bets with pagination", async () => {
      const response = await request(app)
        .get("/api/v1/bets")
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty("page", 1);
      expect(response.body.meta).toHaveProperty("limit", 10);
    });

    testIfDbAvailable("should filter bets by status", async () => {
      const response = await request(app)
        .get("/api/v1/bets")
        .query({ status: "open" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    testIfDbAvailable("should filter bets by category", async () => {
      const response = await request(app)
        .get("/api/v1/bets")
        .query({ categoryId: testCategoryId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/v1/bets/:id", () => {
    testIfDbAvailable("should return a specific bet", async () => {
      const response = await request(app)
        .get(`/api/v1/bets/${testBetId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bet).toHaveProperty("id", testBetId);
      expect(response.body.data.bet).toHaveProperty("title", "Test Bet");
      expect(response.body.data.bet).toHaveProperty("odds");
      expect(response.body.data.bet.odds).toBeInstanceOf(Array);
    });

    testIfDbAvailable("should return 404 for non-existent bet", async () => {
      const response = await request(app).get("/api/v1/bets/99999").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });

    testIfDbAvailable("should return 400 for invalid ID", async () => {
      const response = await request(app)
        .get("/api/v1/bets/invalid")
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/bets", () => {
    testIfDbAvailable("should create a new bet", async () => {
      const betData = {
        title: "New Test Bet",
        description: "New Test Description",
        categoryId: testCategoryId,
        odds: [
          { title: "New Option 1", value: 2.0 },
          { title: "New Option 2", value: 2.0 },
        ],
      };

      const response = await request(app)
        .post("/api/v1/bets")
        .send(betData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bet).toHaveProperty("id");
      expect(response.body.data.bet.title).toBe(betData.title);
      expect(response.body.data.bet.odds).toHaveLength(2);
    });

    testIfDbAvailable("should return 400 for invalid bet data", async () => {
      const invalidBetData = {
        title: "", // Empty title
        categoryId: testCategoryId,
        odds: [],
      };

      const response = await request(app)
        .post("/api/v1/bets")
        .send(invalidBetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    testIfDbAvailable("should return 400 for invalid odds values", async () => {
      const invalidBetData = {
        title: "Test Bet",
        categoryId: testCategoryId,
        odds: [
          { title: "Invalid Option", value: 0.5 }, // Too low
        ],
      };

      const response = await request(app)
        .post("/api/v1/bets")
        .send(invalidBetData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    testIfDbAvailable("should return 404 for non-existent category", async () => {
      const betData = {
        title: "Test Bet",
        categoryId: 99999,
        odds: [
          { title: "Option 1", value: 2.0 },
          { title: "Option 2", value: 2.0 },
        ],
      };

      const response = await request(app)
        .post("/api/v1/bets")
        .send(betData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/v1/bets/:id", () => {
    testIfDbAvailable("should update a bet", async () => {
      const updateData = {
        title: "Updated Bet Title",
        description: "Updated Description",
      };

      const response = await request(app)
        .put(`/api/v1/bets/${testBetId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bet.title).toBe(updateData.title);
      expect(response.body.data.bet.description).toBe(updateData.description);
    });

    testIfDbAvailable("should return 404 for non-existent bet", async () => {
      const updateData = { title: "Updated Title" };

      const response = await request(app)
        .put("/api/v1/bets/99999")
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/bets/:id", () => {
    testIfDbAvailable("should delete a bet", async () => {
      // Create a bet to delete
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
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully");

      // Verify bet is deleted
      const deletedBet = await prisma!.bet.findUnique({
        where: { id: bet.id },
      });
      expect(deletedBet).toBeNull();
    });

    testIfDbAvailable("should return 404 for non-existent bet", async () => {
      const response = await request(app)
        .delete("/api/v1/bets/99999")
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/bets/:id/close", () => {
    testIfDbAvailable("should close a bet", async () => {
      // Create an open bet
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
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bet.status).toBe("closed");

      // Verify bet is closed in database
      const closedBet = await prisma!.bet.findUnique({
        where: { id: bet.id },
      });
      expect(closedBet?.status).toBe("closed");
    });

    testIfDbAvailable(
      "should return 409 when trying to close a non-open bet",
      async () => {
        // Create a closed bet
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
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Only open bets can be closed");
      },
    );
  });

  describe("PATCH /api/v1/bets/:id/resolve", () => {
    testIfDbAvailable("should resolve a bet", async () => {
      // Create a bet with odds
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
        .send({ winningOddId: firstOdd ? firstOdd.id : -1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bet.status).toBe("resolved");

      // Verify odds are updated
      const updatedOdds = await prisma!.odd.findMany({
        where: { betId: bet.id },
        orderBy: { id: "asc" },
      });
      expect(updatedOdds[0]?.result).toBe("won");
      expect(updatedOdds[1]?.result).toBe("lost");
    });

    testIfDbAvailable("should return 400 for invalid winning odd", async () => {
      const response = await request(app)
        .patch(`/api/v1/bets/${testBetId}/resolve`)
        .send({ winningOddId: 99999 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    testIfDbAvailable(
      "should return 409 when trying to resolve an already resolved bet",
      async () => {
        // Create a resolved bet
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
          .send({ winningOddId: firstOdd!.id })
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("already resolved");
      },
    );
  });
});
