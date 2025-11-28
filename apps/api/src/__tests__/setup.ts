import { PrismaClient } from "@prisma/client";

// Global test setup (only when DB tests are enabled)
beforeAll(async () => {
  // Ensure env defaults for tests
  process.env.NODE_ENV = process.env.NODE_ENV || "test";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/sarradabet_test";
  process.env.CORS_ORIGINS =
    process.env.CORS_ORIGINS || "http://localhost:5173";
  process.env.PORT = process.env.PORT || "0";

  if (process.env.RUN_DB_TESTS !== "true") return;

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.DATABASE_URL ||
          "postgresql://postgres:postgres@localhost:5432/sarradabet_test",
      },
    },
  });

  try {
    await prisma.$executeRaw`TRUNCATE TABLE "votes" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "odd" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "bets" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "categories" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "admin_actions" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "admins" CASCADE`;
  } finally {
    await prisma.$disconnect();
  }
});

afterAll(async () => {
  // Cleanup after all tests
});

// Global test utilities
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      testUtils: {
        createTestCategory: () => Promise<unknown>;
        createTestBet: (categoryId: number) => Promise<unknown>;
      };
    }
  }
}

(global as unknown as NodeJS.Global).testUtils = {
  createTestCategory: async () => {
    const prisma = new PrismaClient();
    return prisma.category.create({
      data: { title: "Test Category" },
    });
  },

  createTestBet: async (categoryId: number) => {
    const prisma = new PrismaClient();
    return prisma.bet.create({
      data: {
        title: "Test Bet",
        description: "Test Description",
        categoryId,
        odds: {
          create: [
            { title: "Option 1", value: 2.0 },
            { title: "Option 2", value: 3.0 },
          ],
        },
      },
      include: { odds: true },
    });
  },
};
