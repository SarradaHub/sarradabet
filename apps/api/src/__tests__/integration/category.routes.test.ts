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

describe("Category routes", () => {
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
    "should list and search categories publicly",
    async () => {
      if (!prisma) return;

      await prisma.category.create({
        data: { title: "Futebol Test" },
      });

      const listResponse = await request(app)
        .get("/api/v1/categories")
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data).toBeDefined();

      const searchResponse = await request(app)
        .get("/api/v1/categories/search")
        .query({ searchTerm: "Futebol" })
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should allow admin CRUD on categories",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "catadmin",
        email: "catadmin@example.com",
        phone: "5511999991515",
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: admin.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const createResponse = await request(app)
        .post("/api/v1/categories")
        .set(authHeader(token))
        .send({ title: "Basquete Admin" })
        .expect(201);

      const categoryId = createResponse.body.data.category.id as number;

      await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set(authHeader(token))
        .send({ title: "Basquete Atualizado" })
        .expect(200);

      await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set(authHeader(token))
        .expect(200);
    },
  );
});
