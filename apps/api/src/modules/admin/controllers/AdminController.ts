import { Request, Response } from "express";
import {
  AdminService,
  CreateAdminInput,
  LoginInput,
} from "../services/AdminService";
import { AuthPayload } from "../../../utils/auth";
import { ApiResponse } from "../../../utils/api/response";
import { AppError } from "../../../core/errors/AppError";

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
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

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: CreateAdminInput = req.body;
      const admin = await this.adminService.create(data);

      this.sendSuccess(res, admin, 201);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: LoginInput = req.body;
      const admin = await this.adminService.login(data);

      this.sendSuccess(res, admin, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const authPayload = req.user as AuthPayload;
      const admin = await this.adminService.getById(authPayload.adminId);

      this.sendSuccess(res, admin);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const admins = await this.adminService.getAll();

      this.sendSuccess(res, admins);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const admin = await this.adminService.getById(id);

      this.sendSuccess(res, admin);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const admin = await this.adminService.update(id, data);

      this.sendSuccess(res, admin, 200);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.adminService.delete(id);

      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      this.sendSuccess(res, { message: "Logout successful" });
    } catch (error) {
      this.sendError(res, error);
    }
  };
}
