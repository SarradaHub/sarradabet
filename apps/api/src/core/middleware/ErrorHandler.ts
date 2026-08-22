import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { logger } from "../../utils/logger";
import { AppError, NotFoundError } from "../errors/AppError";
import { invalidCsrfTokenError } from "./CsrfMiddleware";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,

  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message: string;
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

  if (error === invalidCsrfTokenError) {
    statusCode = 403;
    message = "Token de segurança inválido. Recarregue a página.";
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    const contextErrors = error.context?.errors;
    if (Array.isArray(contextErrors) && contextErrors.length > 0) {
      errors = contextErrors as Array<{
        field?: string;
        message: string;
        code?: string;
        stack?: string;
      }>;
    }
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Falha na validação";
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
    message = "Dados inválidos fornecidos";
    errors = [{ message: error.message }];
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = error.message;
  } else if (process.env.NODE_ENV === "production") {
    statusCode = 500;
    message = "Ocorreu um erro genérico. Tente novamente.";
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
        message: "Já existe um registro com estes dados.",
        errors: [{ field: "unique_constraint", message: error.message }],
      };
    case "P2025":
      return {
        statusCode: 404,
        message: "Registro não encontrado",
        errors: [{ message: error.message }],
      };
    case "P2003":
      return {
        statusCode: 400,
        message: "Referência inválida a outro registro",
        errors: [{ message: error.message }],
      };
    case "P2014":
      return {
        statusCode: 400,
        message: "Dados inválidos para a relação",
        errors: [{ message: error.message }],
      };
    default:
      return {
        statusCode: 500,
        message: "Falha na operação do banco de dados",
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
