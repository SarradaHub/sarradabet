import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { Prisma } from "@prisma/client";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { logger } from "../../utils/logger";
import { AppError, NotFoundError } from "../errors/AppError";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,

  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors:
    | Array<{ field?: string; message: string; code?: string; stack?: string }>
    | undefined;
  const requestId = (req.headers["x-request-id"] as string) || "unknown";
  const timestamp = new Date().toISOString();

  const isOperational = error instanceof AppError && error.isOperational;
  const logLevel = isOperational ? "warn" : "error";

  logger[logLevel]("Error occurred:", {
    requestId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp,
    isOperational,
    body: req.method !== "GET" ? req.body : undefined,
    params: req.params,
    query: req.query,
  });

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.context
      ? [{ message: String((error.context as any).message ?? message) }]
      : undefined;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    }));
  } else if (error instanceof PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errors = prismaError.errors;
  } else if (error instanceof PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data provided";
    errors = [{ message: error.message }];
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = error.message;
  } else if (process.env.NODE_ENV === "production") {
    statusCode = 500;
    message = "Something went wrong";
    errors = undefined;
  } else {
    statusCode = 500;
    message = error.message;
    errors = [{ message, stack: error.stack }];
  }

  const errorResponse: {
    success: false;
    message: string;
    errors?: Array<{
      field?: string;
      message: string;
      code?: string;
      stack?: string;
    }>;
    requestId: string;
    timestamp: string;
    stack?: string;
    details?: string;
    url?: string;
    method?: string;
  } = {
    success: false,
    message,
    errors,
    requestId,
    timestamp,
  };

  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = error.stack;
    errorResponse.details = error.message;
    errorResponse.url = req.url;
    errorResponse.method = req.method;
  }

  res.status(statusCode).json(errorResponse);

  if (!isOperational && process.env.NODE_ENV === "production") {
    logger.error("Non-operational error occurred", {
      requestId,
      error: error.message,
      stack: error.stack,
    });
  }
};

const handlePrismaError = (error: PrismaClientKnownRequestError) => {
  switch (error.code) {
    case "P2002":
      return {
        statusCode: 409,
        message: "A record with this data already exists",
        errors: [{ field: "unique_constraint", message: error.message }],
      };
    case "P2025":
      return {
        statusCode: 404,
        message: "Record not found",
        errors: [{ message: error.message }],
      };
    case "P2003":
      return {
        statusCode: 400,
        message: "Invalid reference to related record",
        errors: [{ message: error.message }],
      };
    case "P2014":
      return {
        statusCode: 400,
        message: "Invalid data for relation",
        errors: [{ message: error.message }],
      };
    default:
      return {
        statusCode: 500,
        message: "Database operation failed",
        errors: [{ message: error.message }],
      };
  }
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = (req.headers["x-request-id"] as string) || "unknown";
  const timestamp = new Date().toISOString();

  logger.warn(`404 Not Found: ${req.method} ${req.path}`, {
    requestId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp,
  });

  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

export const asyncHandler = <
  T extends (req: Request, res: Response, next: NextFunction) => unknown,
>(
  fn: T,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
