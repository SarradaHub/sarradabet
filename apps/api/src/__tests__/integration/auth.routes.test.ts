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
process.env.NODE_ENV = "test";

import { PrismaClient, UserRole } from "@prisma/client";
import express from "express";
import request from "supertest";
import { createRateLimit } from "../../core/middleware/SecurityMiddleware";
import { app } from "../../app";
import { tokenBlacklistService } from "../../services/TokenBlacklistService";
import {
  authHeader,
  checkDatabaseConnection,
  cleanupAuthData,
  createTestUser,
  refreshCookieName,
  testIfDbAvailable,
} from "../helpers/authTestHelper";

let prisma: PrismaClient | null = null;
let isDatabaseAvailable = false;

describe("Auth Routes Integration Tests", () => {
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

    await cleanupAuthData(prisma);
  });

  beforeEach(() => {
    tokenBlacklistService.clearMemoryStore();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
      prisma = null;
    }
  });

  describe("POST /api/v1/auth/register", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should register a user and set refresh cookie",
      async () => {
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            username: "newuser",
            email: "newuser@example.com",
            phone: "(11) 99999-1234",
            password: "password123",
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toMatchObject({
          username: "newuser",
          email: "newuser@example.com",
          phone: "5511999991234",
          role: "USER",
        });
        expect(response.body.data.accessToken).toHaveProperty("token");
        expect(response.headers["set-cookie"]?.[0]).toContain(
          `${refreshCookieName}=`,
        );
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 400 for duplicate username",
      async () => {
        await request(app)
          .post("/api/v1/auth/register")
          .send({
            username: "duplicate",
            email: "first@example.com",
            phone: "5511999991111",
            password: "password123",
          })
          .expect(201);

        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            username: "duplicate",
            email: "second@example.com",
            phone: "5511999992222",
            password: "password123",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 400 for invalid phone",
      async () => {
        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            username: "badphone",
            email: "badphone@example.com",
            phone: "123",
            password: "password123",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 400 for duplicate phone",
      async () => {
        await request(app)
          .post("/api/v1/auth/register")
          .send({
            username: "phoneuser1",
            email: "phoneuser1@example.com",
            phone: "5511999993333",
            password: "password123",
          })
          .expect(201);

        const response = await request(app)
          .post("/api/v1/auth/register")
          .send({
            username: "phoneuser2",
            email: "phoneuser2@example.com",
            phone: "5511999993333",
            password: "password123",
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      },
    );
  });

  describe("POST /api/v1/auth/login", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should login with valid credentials",
      async () => {
        await request(app)
          .post("/api/v1/auth/register")
          .send({
            username: "loginuser",
            email: "loginuser@example.com",
            phone: "5511999994444",
            password: "password123",
          })
          .expect(201);

        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({
            username: "loginuser",
            password: "password123",
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.accessToken).toHaveProperty("token");
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 401 for invalid credentials",
      async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({
            username: "missinguser",
            password: "wrongpassword",
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      },
    );
  });

  describe("POST /api/v1/auth/refresh", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should rotate refresh token and return new access token",
      async () => {
        const agent = request.agent(app);

        await agent
          .post("/api/v1/auth/register")
          .send({
            username: "refreshuser",
            email: "refreshuser@example.com",
            phone: "5511999995555",
            password: "password123",
          })
          .expect(201);

        const refreshResponse = await agent
          .post("/api/v1/auth/refresh")
          .expect(200);

        expect(refreshResponse.body.success).toBe(true);
        expect(refreshResponse.body.data.accessToken).toHaveProperty("token");
        expect(refreshResponse.headers["set-cookie"]?.[0]).toContain(
          `${refreshCookieName}=`,
        );
      },
    );
  });

  describe("POST /api/v1/auth/logout", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should logout and clear refresh cookie",
      async () => {
        const agent = request.agent(app);

        await agent
          .post("/api/v1/auth/register")
          .send({
            username: "logoutuser",
            email: "logoutuser@example.com",
            phone: "5511999996666",
            password: "password123",
          })
          .expect(201);

        const logoutResponse = await agent
          .post("/api/v1/auth/logout")
          .expect(200);

        expect(logoutResponse.body.success).toBe(true);
        expect(logoutResponse.body.message).toBe("Logout successful");
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should blacklist access token after logout with Bearer",
      async () => {
        const agent = request.agent(app);

        const registerResponse = await agent
          .post("/api/v1/auth/register")
          .send({
            username: "blacklistuser",
            email: "blacklistuser@example.com",
            phone: "5511999997777",
            password: "password123",
          })
          .expect(201);

        const accessToken = registerResponse.body.data.accessToken.token;

        await agent
          .post("/api/v1/auth/logout")
          .set(authHeader(accessToken))
          .expect(200);

        const meResponse = await request(app)
          .get("/api/v1/auth/me")
          .set(authHeader(accessToken))
          .expect(401);

        expect(meResponse.body.success).toBe(false);
      },
    );
  });

  describe("GET /api/v1/auth/me", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return current user profile with valid token",
      async () => {
        const agent = request.agent(app);

        const registerResponse = await agent
          .post("/api/v1/auth/register")
          .send({
            username: "meuser",
            email: "meuser@example.com",
            phone: "5511999998888",
            password: "password123",
          })
          .expect(201);

        const accessToken = registerResponse.body.data.accessToken.token;

        const response = await request(app)
          .get("/api/v1/auth/me")
          .set(authHeader(accessToken))
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe("meuser");
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should return 401 without token",
      async () => {
        const response = await request(app)
          .get("/api/v1/auth/me")
          .expect(401);

        expect(response.body.success).toBe(false);
      },
    );
  });

  describe("POST /api/v1/auth/login rate limit", () => {
    it("should return 429 after too many login attempts", async () => {
      const rateLimitApp = express();
      rateLimitApp.use(
        createRateLimit({
          windowMs: 15 * 60 * 1000,
          max: 2,
          message: "Too many login attempts, please try again later",
          skipSuccessfulRequests: false,
        }),
      );
      rateLimitApp.post("/login", (_req, res) => {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      });

      await request(rateLimitApp).post("/login").expect(401);
      await request(rateLimitApp).post("/login").expect(401);
      await request(rateLimitApp).post("/login").expect(429);
    });
  });
});

describe("User Routes Integration Tests", () => {
  let userPrisma: PrismaClient | null = null;

  beforeAll(async () => {
    const dbAvailable = await checkDatabaseConnection(testDbUrl);
    isDatabaseAvailable = dbAvailable;

    if (!dbAvailable) {
      return;
    }

    userPrisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    await cleanupAuthData(userPrisma);
  });

  beforeEach(() => {
    tokenBlacklistService.clearMemoryStore();
  });

  afterAll(async () => {
    if (userPrisma) {
      await userPrisma.$disconnect();
      userPrisma = null;
    }
  });

  describe("GET /api/v1/users", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should forbid regular users from listing all users",
      async () => {
        if (!userPrisma) return;

        const user = await createTestUser(userPrisma, {
          username: "regularuser",
          email: "regular@example.com",
        });

        const loginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            username: user.username,
            password: "password123",
          })
          .expect(200);

        const response = await request(app)
          .get("/api/v1/users")
          .set(authHeader(loginResponse.body.data.accessToken.token))
          .expect(403);

        expect(response.body.success).toBe(false);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should allow admin to list all users",
      async () => {
        if (!userPrisma) return;

        const admin = await createTestUser(userPrisma, {
          username: "adminuser",
          email: "admin@example.com",
          role: UserRole.ADMIN,
        });

        const loginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            username: admin.username,
            password: "password123",
          })
          .expect(200);

        const response = await request(app)
          .get("/api/v1/users")
          .set(authHeader(loginResponse.body.data.accessToken.token))
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      },
    );
  });

  describe("PUT /api/v1/users/:id", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should allow user to update own profile",
      async () => {
        if (!userPrisma) return;

        const user = await createTestUser(userPrisma, {
          username: "profileuser",
          email: "profile@example.com",
        });

        const loginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            username: user.username,
            password: "password123",
          })
          .expect(200);

        const response = await request(app)
          .put(`/api/v1/users/${user.id}`)
          .set(authHeader(loginResponse.body.data.accessToken.token))
          .send({ username: "updatedprofile" })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe("updatedprofile");
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should forbid user from updating another user's profile",
      async () => {
        if (!userPrisma) return;

        const user = await createTestUser(userPrisma, {
          username: "userone",
          email: "userone@example.com",
        });
        const otherUser = await createTestUser(userPrisma, {
          username: "usertwo",
          email: "usertwo@example.com",
        });

        const loginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            username: user.username,
            password: "password123",
          })
          .expect(200);

        const response = await request(app)
          .put(`/api/v1/users/${otherUser.id}`)
          .set(authHeader(loginResponse.body.data.accessToken.token))
          .send({ username: "hacked" })
          .expect(403);

        expect(response.body.success).toBe(false);
      },
    );
  });

  describe("DELETE /api/v1/users/:id", () => {
    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should allow admin to delete another user",
      async () => {
        if (!userPrisma) return;

        const admin = await createTestUser(userPrisma, {
          username: "deleteadmin",
          email: "deleteadmin@example.com",
          role: UserRole.ADMIN,
        });
        const target = await createTestUser(userPrisma, {
          username: "deletetarget",
          email: "deletetarget@example.com",
        });

        const loginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            username: admin.username,
            password: "password123",
          })
          .expect(200);

        const response = await request(app)
          .delete(`/api/v1/users/${target.id}`)
          .set(authHeader(loginResponse.body.data.accessToken.token))
          .expect(200);

        expect(response.body.success).toBe(true);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should forbid admin from deleting own account",
      async () => {
        if (!userPrisma) return;

        const admin = await createTestUser(userPrisma, {
          username: "selfdeleteadmin",
          email: "selfdeleteadmin@example.com",
          role: UserRole.ADMIN,
        });

        const loginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            username: admin.username,
            password: "password123",
          })
          .expect(200);

        const response = await request(app)
          .delete(`/api/v1/users/${admin.id}`)
          .set(authHeader(loginResponse.body.data.accessToken.token))
          .expect(403);

        expect(response.body.success).toBe(false);
      },
    );

    testIfDbAvailable(
      () => isDatabaseAvailable,
      "should forbid regular user from deleting users",
      async () => {
        if (!userPrisma) return;

        const user = await createTestUser(userPrisma, {
          username: "regulardelete",
          email: "regulardelete@example.com",
        });
        const target = await createTestUser(userPrisma, {
          username: "deletetarget2",
          email: "deletetarget2@example.com",
        });

        const loginResponse = await request(app)
          .post("/api/v1/auth/login")
          .send({
            username: user.username,
            password: "password123",
          })
          .expect(200);

        const response = await request(app)
          .delete(`/api/v1/users/${target.id}`)
          .set(authHeader(loginResponse.body.data.accessToken.token))
          .expect(403);

        expect(response.body.success).toBe(false);
      },
    );
  });
});
