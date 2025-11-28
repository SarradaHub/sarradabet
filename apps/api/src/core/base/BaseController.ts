import { Request, Response, NextFunction } from "express";
import { IController } from "../interfaces/IController";
import { ApiResponse } from "../../utils/api/response";
import { IService } from "../interfaces/IService";
import { PaginationParams } from "../interfaces/IRepository";
import { AppError, BadRequestError } from "../errors/AppError";

export abstract class BaseController<T, CreateInput, UpdateInput>
  implements IController
{
  constructor(
    protected readonly service: IService<T, CreateInput, UpdateInput>,
  ) {}

  abstract findAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  abstract findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  abstract create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  abstract update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  abstract delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;

  protected parsePaginationParams(req: Request): PaginationParams {
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    return {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    };
  }

  protected parseId(req: Request): number {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestError("Invalid ID provided");
    }
    return id;
  }

  protected sendSuccess(
    res: Response,
    data: unknown,
    statusCode: number = 200,
    message?: string,
  ): void {
    // Include message in the response data if provided
    const responseData = message
      ? typeof data === "object" && data !== null && !Array.isArray(data)
        ? { ...(data as Record<string, unknown>), message }
        : { data, message }
      : data;
    new ApiResponse(res).success(responseData as any, statusCode);
  }

  protected sendError(
    res: Response,
    err: unknown,
    fallbackStatusCode: number = 400,
    errors?: Array<{ field?: string; message: string; code?: string }>,
  ): void {
    let message = "An error occurred";
    let statusCode = fallbackStatusCode;

    if (err instanceof AppError) {
      message = err.message;
      statusCode = err.statusCode;
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    new ApiResponse(res).error(message, errors, statusCode);
  }

  protected handleError(error: Error, res: Response, next: NextFunction): void {
    next(error);
  }
}
