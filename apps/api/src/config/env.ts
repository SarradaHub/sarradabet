import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

// Supabase Vercel integration exposes POSTGRES_* names; Prisma expects DATABASE_URL + DIRECT_URL.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL;
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL;
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8000),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  DATABASE_URL: z
    .string()
    .regex(/^postgresql:\/\/.+/)
    .default("postgresql://postgres:postgres@localhost:5432/sarradabet_test"),
  DIRECT_URL: z
    .string()
    .regex(/^postgresql:\/\/.+/)
    .optional(),
  API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
});

export const config = envSchema.parse(process.env);
export type EnvConfig = z.infer<typeof envSchema>;
