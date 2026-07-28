import { NextFunction, Request, Response } from "express";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";
import { UserStatsService } from "../services/UserStatsService";
import { ApiResponse } from "../../../utils/api/response";

export class UserStatsController {
  constructor(
    private readonly userStatsService: UserStatsService = new UserStatsService(),
  ) {}

  getMyStats = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const stats = await this.userStatsService.getByUserId(user.userId);
      new ApiResponse(res).success({ ...stats });
    } catch (error) {
      next(error);
    }
  };
}
