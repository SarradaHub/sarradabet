import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const postgresUrlRegex = /^postgres(ql)?:\/\/.+/;

function unsetIfEmpty(key: string): void {
  const value = process.env[key];
  if (value !== undefined && value.trim() === "") {
    delete process.env[key];
  }
}

function normalizePostgresUrl(url: string | undefined): string | undefined {
  if (!url || url.trim() === "") {
    return undefined;
  }

  return url.replace(/^postgres:\/\//, "postgresql://");
}

// Treat empty strings as unset so Zod defaults / optional apply correctly.
for (const key of [
  "DATABASE_URL",
  "DIRECT_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
]) {
  unsetIfEmpty(key);
}

// Supabase Vercel integration exposes POSTGRES_* names; Prisma expects DATABASE_URL + DIRECT_URL.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL;
}

const normalizedDatabaseUrl = normalizePostgresUrl(process.env.DATABASE_URL);
const normalizedDirectUrl = normalizePostgresUrl(process.env.DIRECT_URL);

if (normalizedDatabaseUrl) {
  process.env.DATABASE_URL = normalizedDatabaseUrl;
}
if (normalizedDirectUrl) {
  process.env.DIRECT_URL = normalizedDirectUrl;
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8000),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  DATABASE_URL: z
    .string()
    .regex(postgresUrlRegex)
    .default("postgresql://postgres:postgres@localhost:5432/sarradabet_test"),
  DIRECT_URL: z.string().regex(postgresUrlRegex).optional(),
  API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
});

export const config = envSchema.parse(process.env);
export type EnvConfig = z.infer<typeof envSchema>;
