import { execSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://appuser:sarradabet1234@localhost:5433/sarradabet_test";

export function getTestDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL || DEFAULT_TEST_DATABASE_URL;

  if (dbUrl.includes("/sarradabet") && !dbUrl.includes("/sarradabet_test")) {
    return dbUrl.replace("/sarradabet", "/sarradabet_test");
  }

  return dbUrl;
}

function getDatabaseName(databaseUrl: string): string {
  const pathname = new URL(databaseUrl).pathname.replace(/^\//, "");
  return pathname.split("?")[0];
}

function getMaintenanceDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  const maintenanceDb = url.pathname.includes("sarradabet_test")
    ? "sarradabet"
    : "postgres";
  url.pathname = `/${maintenanceDb}`;
  return url.toString();
}

function databaseExistsError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("does not exist") ||
      error.message.includes("P1003"))
  );
}

function databaseAlreadyExistsError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("already exists") ||
      error.message.includes("42P04"))
  );
}

async function createTestDatabase(testDbUrl: string): Promise<void> {
  const dbName = getDatabaseName(testDbUrl);
  const maintenanceUrl = getMaintenanceDatabaseUrl(testDbUrl);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: maintenanceUrl,
      },
    },
  });

  try {
    await prisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  } finally {
    await prisma.$disconnect();
  }
}

function runMigrations(testDbUrl: string): void {
  const apiRoot = path.resolve(__dirname, "../../..");

  execSync("npx prisma migrate deploy", {
    cwd: apiRoot,
    env: {
      ...process.env,
      DATABASE_URL: testDbUrl,
      DIRECT_URL: testDbUrl,
    },
    stdio: "pipe",
  });
}

export async function ensureTestDatabase(): Promise<boolean> {
  const testDbUrl = getTestDatabaseUrl();
  process.env.DATABASE_URL = testDbUrl;

  let prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl,
      },
    },
  });

  try {
    await prisma.$connect();
    await prisma.$disconnect();
  } catch (error) {
    await prisma.$disconnect().catch(() => undefined);

    if (!databaseExistsError(error)) {
      console.warn(
        `[test-db] Connection failed (${testDbUrl}): ${
          error instanceof Error ? error.message : String(error)
        }. Integration tests will be skipped.`,
      );
      return false;
    }

    try {
      await createTestDatabase(testDbUrl);
    } catch (createError) {
      if (!databaseAlreadyExistsError(createError)) {
        console.warn(
          `[test-db] Failed to create test database: ${
            createError instanceof Error ? createError.message : String(createError)
          }`,
        );
        return false;
      }
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    try {
      await prisma.$connect();
    } catch (connectError) {
      console.warn(
        `[test-db] Could not connect after create: ${
          connectError instanceof Error ? connectError.message : String(connectError)
        }`,
      );
      return false;
    } finally {
      await prisma.$disconnect();
    }
  }

  try {
    runMigrations(testDbUrl);
    console.log(`[test-db] Ready at ${testDbUrl}`);
    return true;
  } catch (error) {
    console.warn(
      `[test-db] Migration failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}
