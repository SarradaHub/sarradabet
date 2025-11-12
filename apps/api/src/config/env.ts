import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  DATABASE_URL: z
    .string()
    .regex(/^postgresql:\/\/.+/)
    .default("postgresql://postgres:postgres@localhost:5432/sarradabet_test"),
  API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  EVENT_GATEWAY_URL: z.string().url().optional(),
  EVENT_GATEWAY_API_KEY: z.string().optional(),
  KAFKA_BROKERS: z.string().optional(),
  KAFKA_CLIENT_ID: z.string().default("sarradabet-api"),
  KAFKA_CONSUMER_GROUP: z.string().default("sarradabet-match-consumers"),
});

export const config = envSchema.parse(process.env);
export type EnvConfig = z.infer<typeof envSchema>;
