import { PrismaClient, UserRole } from "@prisma/client";
import request from "supertest";
import { app } from "../../app";
import { hashPassword } from "../../utils/auth";
import { config } from "../../config/env";

export { getTestDatabaseUrl } from "./testDatabase";

export async function checkDatabaseConnection(
  testDbUrl: string,
): Promise<boolean> {
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
      `Database connection check failed: ${error instanceof Error ? error.message : "Unknown error"}. Integration tests will be skipped. Run \`docker compose up -d db\` and \`npm run db:test:setup --workspace=apps/api\` if needed.`,
    );
    try {
      await testClient.$disconnect();
    } catch {
      // Ignore disconnect errors
    }
    return false;
  }
}

export const testIfDbAvailable = (
  getIsDatabaseAvailable: () => boolean,
  name: string,
  fn?: jest.ProvidesCallback,
) => {
  it(name, async () => {
    if (!getIsDatabaseAvailable()) {
      pending("Database not available");
    }

    if (fn) {
      await (fn as () => Promise<void>)();
    }
  });
};

export const cleanupAuthData = async (prisma: PrismaClient): Promise<void> => {
  await prisma.pixPayment.deleteMany();
  await prisma.coinTransaction.deleteMany();
  await prisma.coinPackage.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
};

export const createTestUser = async (
  prisma: PrismaClient,
  overrides?: {
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: UserRole;
  },
) => {
  const username = overrides?.username ?? `user_${Date.now()}`;
  const email = overrides?.email ?? `${username}@example.com`;
  const phone =
    overrides?.phone ?? `5511999${String(Date.now()).slice(-6)}`;
  const password = overrides?.password ?? "password123";
  const role = overrides?.role ?? UserRole.USER;

  return prisma.user.create({
    data: {
      username,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role,
    },
  });
};

export const registerAndLogin = async (
  userData: {
    username: string;
    email: string;
    phone: string;
    password: string;
  },
) => {
  const agent = request.agent(app);

  const registerResponse = await agent
    .post("/api/v1/auth/register")
    .send(userData)
    .expect(201);

  return {
    agent,
    user: registerResponse.body.data.user,
    accessToken: registerResponse.body.data.accessToken.token as string,
    cookies: registerResponse.headers["set-cookie"],
  };
};

export const authHeader = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

export const refreshCookieName = config.REFRESH_TOKEN_COOKIE_NAME;
