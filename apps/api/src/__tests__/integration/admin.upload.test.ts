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
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

jest.mock("../../modules/upload/services/StorageService", () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    uploadRewardImage: jest.fn().mockResolvedValue(
      "https://example.supabase.co/storage/v1/object/public/reward-images/rewards/test.webp",
    ),
  })),
}));

import { PrismaClient, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../../app";
import {
  authHeader,
  checkDatabaseConnection,
  cleanupAuthData,
  createTestUser,
  testIfDbAvailable,
  uniqueTestPhone,
} from "../helpers/authTestHelper";

let prisma: PrismaClient | null = null;
let isDatabaseAvailable = false;

describe("Admin Upload Routes", () => {
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
    "should return 401 without authentication",
    async () => {
      await request(app)
        .post("/api/v1/admin/uploads/reward-image")
        .attach("file", Buffer.from("fake"), {
          filename: "test.jpg",
          contentType: "image/jpeg",
        })
        .expect(401);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should return 403 for non-admin users",
    async () => {
      if (!prisma) return;

      const user = await createTestUser(prisma, {
        username: "uploaduser",
        email: "uploaduser@example.com",
        phone: uniqueTestPhone(888802),
        role: UserRole.USER,
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: user.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      await request(app)
        .post("/api/v1/admin/uploads/reward-image")
        .set(authHeader(token))
        .attach("file", Buffer.from("fake"), {
          filename: "test.jpg",
          contentType: "image/jpeg",
        })
        .expect(403);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should return 400 for unsupported MIME type",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "uploadadmin",
        email: "uploadadmin@example.com",
        phone: uniqueTestPhone(888803),
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: admin.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const response = await request(app)
        .post("/api/v1/admin/uploads/reward-image")
        .set(authHeader(token))
        .attach("file", Buffer.from("%PDF-1.4"), {
          filename: "document.pdf",
          contentType: "application/pdf",
        })
        .expect(400);

      expect(response.body.message).toMatch(/unsupported image type/i);
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should return public URL for admin upload",
    async () => {
      if (!prisma) return;

      const admin = await createTestUser(prisma, {
        username: "uploadadmin2",
        email: "uploadadmin2@example.com",
        phone: uniqueTestPhone(888804),
        role: UserRole.ADMIN,
      });

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({ username: admin.username, password: "password123" })
        .expect(200);

      const token = loginResponse.body.data.accessToken.token as string;

      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      );

      const response = await request(app)
        .post("/api/v1/admin/uploads/reward-image")
        .set(authHeader(token))
        .attach("file", pngBuffer, {
          filename: "pixel.png",
          contentType: "image/png",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toContain("reward-images/rewards/");
    },
  );
});
