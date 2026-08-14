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
process.env.GOOGLE_CLIENT_ID = "google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
process.env.GOOGLE_CALLBACK_URL =
  "http://localhost:8000/api/v1/auth/oauth/google/callback";
process.env.OAUTH_FRONTEND_SUCCESS_URL = "http://localhost:3002/oauth/callback";
process.env.OAUTH_FRONTEND_ERROR_URL = "http://localhost:3002/login?error=oauth";

import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { app } from "../../app";
import {
  checkDatabaseConnection,
  cleanupAuthData,
  refreshCookieName,
  testIfDbAvailable,
} from "../helpers/authTestHelper";
import { createOAuthProvider } from "../../modules/auth/oauth/createOAuthProvider";
import { oauthStateStore } from "../../modules/auth/services/OAuthStateStore";

jest.mock("../../modules/auth/oauth/createOAuthProvider");

let prisma: PrismaClient | null = null;
let isDatabaseAvailable = false;

const mockCreateOAuthProvider = createOAuthProvider as jest.MockedFunction<
  typeof createOAuthProvider
>;

describe("OAuth Routes Integration Tests", () => {
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
    jest.clearAllMocks();
    oauthStateStore.clearMemoryStore();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
      prisma = null;
    }
  });

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should redirect to provider authorization URL",
    async () => {
      mockCreateOAuthProvider.mockReturnValue({
        provider: "google",
        createAuthorizationRequest: () => ({
          url: new URL("https://accounts.google.com/o/oauth2/v2/auth?state=test"),
          state: "test-state",
          codeVerifier: "test-verifier",
        }),
        validateCallback: jest.fn(),
      });

      const response = await request(app)
        .get("/api/v1/auth/oauth/google")
        .expect(302);

      expect(response.headers.location).toContain("accounts.google.com");
      expect(response.headers["set-cookie"]?.[0]).toContain("oauth_state=");
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should complete callback, set refresh cookie, and redirect to frontend",
    async () => {
      const validateCallback = jest.fn().mockResolvedValue({
        provider: "google",
        providerAccountId: "google-user-1",
        email: "social@example.com",
        name: "Social User",
      });

      mockCreateOAuthProvider.mockReturnValue({
        provider: "google",
        createAuthorizationRequest: () => ({
          url: new URL("https://accounts.google.com/o/oauth2/v2/auth?state=test"),
          state: "test-state",
          codeVerifier: "test-verifier",
        }),
        validateCallback,
      });

      const startResponse = await request(app)
        .get("/api/v1/auth/oauth/google")
        .expect(302);

      const setCookieHeader = startResponse.headers["set-cookie"];
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : setCookieHeader
          ? [setCookieHeader]
          : [];
      const oauthStateCookie = cookies.find((cookie: string) =>
        cookie.startsWith("oauth_state="),
      );

      expect(oauthStateCookie).toBeDefined();

      const callbackResponse = await request(app)
        .get("/api/v1/auth/oauth/google/callback")
        .set("Cookie", oauthStateCookie!)
        .query({ code: "auth-code", state: "test-state" })
        .expect(302);

      expect(callbackResponse.headers.location).toBe(
        "http://localhost:3002/oauth/callback",
      );
      expect(callbackResponse.headers["set-cookie"]?.[0]).toContain(
        `${refreshCookieName}=`,
      );

      const user = await prisma!.user.findUnique({
        where: { email: "social@example.com" },
        include: { oauthAccounts: true },
      });

      expect(user).not.toBeNull();
      expect(user?.oauthAccounts).toHaveLength(1);
      expect(user?.oauthAccounts[0]?.provider).toBe("google");
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should redirect to error URL when OAuth state is invalid",
    async () => {
      mockCreateOAuthProvider.mockReturnValue({
        provider: "google",
        createAuthorizationRequest: () => ({
          url: new URL("https://accounts.google.com/o/oauth2/v2/auth?state=test"),
          state: "test-state",
          codeVerifier: "test-verifier",
        }),
        validateCallback: jest.fn(),
      });

      const response = await request(app)
        .get("/api/v1/auth/oauth/google/callback")
        .query({ code: "auth-code", state: "wrong-state" })
        .expect(302);

      expect(response.headers.location).toBe(
        "http://localhost:3002/login?error=oauth",
      );
    },
  );

  testIfDbAvailable(
    () => isDatabaseAvailable,
    "should return 404 for unknown provider",
    async () => {
      const response = await request(app)
        .get("/api/v1/auth/oauth/twitter")
        .expect(404);

      expect(response.body.success).toBe(false);
    },
  );
});
