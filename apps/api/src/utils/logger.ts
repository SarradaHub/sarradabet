import winston from "winston";
import { config } from "../config/env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console(),
];

// Vercel/serverless has a read-only filesystem — file logging crashes on boot.
if (config.NODE_ENV === "development" && !process.env.VERCEL) {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  );
}

export const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    config.NODE_ENV === "development" ? colorize() : winston.format.json(),
    logFormat,
  ),
  transports,
});
