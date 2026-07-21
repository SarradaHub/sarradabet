import { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { UserService } from "../services/UserService";
import { ApiResponse } from "../../../utils/api/response";
import { AppError, ForbiddenError } from "../../../core/errors/AppError";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  private sendSuccess(
    res: Response,
    data: unknown,
    statusCode: number = 200,
  ): void {
    new ApiResponse(res).success(data as any, statusCode);
  }

  private sendError(
    res: Response,
    err: unknown,
    fallbackStatusCode: number = 400,
  ): void {
    let message = "An error occurred";
    let statusCode = fallbackStatusCode;

    if (err instanceof AppError) {
      message = err.message;
      statusCode = err.statusCode;
    } else if (err instanceof Error) {
      message = err.message;
    }

    new ApiResponse(res).error(message, undefined, statusCode);
  }

  private getRequestUser(req: Request): Extract<RequestUser, { type: "user" }> {
    if (!req.user || req.user.type !== "user") {
      throw new ForbiddenError("User authentication required");
    }

    return req.user;
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      this.getRequestUser(req);
      const users = await this.userService.findAll();
      this.sendSuccess(res, users);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await this.userService.findById(id);
      this.sendSuccess(res, user);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const requester = this.getRequestUser(req);
      const id = parseInt(req.params.id, 10);
      const body = { ...req.body };

      if (body.role && requester.role !== UserRole.ADMIN) {
        throw new ForbiddenError("Only admins can change user roles");
      }

      const user = await this.userService.update(id, body);
      this.sendSuccess(res, user);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const requester = this.getRequestUser(req);
      const id = parseInt(req.params.id, 10);
      await this.userService.delete(id, requester.userId);
      this.sendSuccess(res, { message: "User deleted successfully" });
    } catch (error) {
      this.sendError(res, error);
    }
  };
}
