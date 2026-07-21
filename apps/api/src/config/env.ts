import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

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

for (const key of [
  "DATABASE_URL",
  "DIRECT_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "MERCADOPAGO_ACCESS_TOKEN",
  "MERCADOPAGO_WEBHOOK_SECRET",
  "MERCADOPAGO_NOTIFICATION_URL",
  "MERCADOPAGO_USER_ID",
  "MERCADOPAGO_STORE_ID",
  "MERCADOPAGO_POS_ID",
  "MERCADOPAGO_POS_UUID",
  "MERCADOPAGO_STORE_REFERENCE",
  "MERCADOPAGO_POS_CATEGORY",
]) {
  unsetIfEmpty(key);
}

if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
  process.env.MERCADOPAGO_ACCESS_TOKEN =
    process.env.MERCADOPAGO_ACCESS_TOKEN.trim();
}
if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
  process.env.MERCADOPAGO_WEBHOOK_SECRET =
    process.env.MERCADOPAGO_WEBHOOK_SECRET.trim();
}

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
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3002,http://localhost:5173"),
  DATABASE_URL: z
    .string()
    .regex(postgresUrlRegex)
    .default("postgresql://postgres:postgres@localhost:5432/sarradabet_test"),
  DIRECT_URL: z.string().regex(postgresUrlRegex).optional(),
  API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default("refreshToken"),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  MERCADOPAGO_NOTIFICATION_URL: z.string().url().optional(),
  MERCADOPAGO_USER_ID: z.coerce.number().int().positive().optional(),
  MERCADOPAGO_STORE_EXTERNAL_ID: z.string().default("SARRADABET001"),
  MERCADOPAGO_STORE_NAME: z.string().default("SarradaBet Loja"),
  MERCADOPAGO_STORE_STREET_NAME: z.string().default("Rua Exemplo"),
  MERCADOPAGO_STORE_STREET_NUMBER: z.string().default("123"),
  MERCADOPAGO_STORE_CITY_NAME: z.string().default("São Paulo"),
  MERCADOPAGO_STORE_STATE_NAME: z.string().default("São Paulo"),
  MERCADOPAGO_STORE_LATITUDE: z.coerce.number().default(-23.55052),
  MERCADOPAGO_STORE_LONGITUDE: z.coerce.number().default(-46.633308),
  MERCADOPAGO_STORE_REFERENCE: z.string().optional(),
  MERCADOPAGO_STORE_ID: z.coerce.number().int().positive().optional(),
  MERCADOPAGO_POS_EXTERNAL_ID: z.string().default("SARRADABET001POS001"),
  MERCADOPAGO_POS_NAME: z.string().default("SarradaBet Caixa"),
  MERCADOPAGO_POS_CATEGORY: z.coerce.number().int().positive().optional(),
  MERCADOPAGO_POS_ID: z.coerce.number().int().positive().optional(),
  MERCADOPAGO_POS_UUID: z.string().optional(),
  PIX_EXPIRATION_MINUTES: z.coerce
    .number()
    .int()
    .min(30, "Pix expiration must be at least 30 minutes (Mercado Pago limit)")
    .max(43200, "Pix expiration cannot exceed 30 days")
    .default(30),
  MERCADOPAGO_MOCK_PIX: z.coerce.boolean().default(false),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  AUTH_LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_REGISTER_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
});

export const config = envSchema.parse(process.env);

if (config.MERCADOPAGO_MOCK_PIX && config.NODE_ENV === "production") {
  throw new Error("MERCADOPAGO_MOCK_PIX cannot be enabled in production");
}

export type EnvConfig = z.infer<typeof envSchema>;
