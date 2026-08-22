import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../errors/AppError";
import { logger } from "../../utils/logger";

export const validateRequest = (
  schema: ZodSchema,
  property: "body" | "query" | "params" = "body",
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      logger.debug(`Validation started for ${property}`);

      const result = schema.safeParse(req[property]);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        const fields = errors.map((e) => e.field).join(", ");
        logger.warn(
          `Validation failed for ${property}. Errors: ${errors.length}. Fields: ${fields}`,
        );

        throw new ValidationError("Falha na validação", { errors });
      }

      logger.debug(`Validation passed for ${property}`);
      req[property] = result.data;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Validation middleware error: ${message}`);
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) =>
  validateRequest(schema, "params");

export const validateQuery = (schema: ZodSchema) =>
  validateRequest(schema, "query");

export const validateBody = (schema: ZodSchema) =>
  validateRequest(schema, "body");

export const validateZodError = (error: ZodError): ValidationError => {
  const errors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  return new ValidationError("Falha na validação", { errors });
};
