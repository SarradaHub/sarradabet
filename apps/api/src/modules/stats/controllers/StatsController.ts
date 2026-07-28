import { NextFunction, Request, Response } from "express";
import { LeaderboardService } from "../services/LeaderboardService";
import { ApiResponse } from "../../../utils/api/response";

export class StatsController {
  constructor(
    private readonly leaderboardService: LeaderboardService = new LeaderboardService(),
  ) {}

  getLeaderboard = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { limit } = req.query as unknown as { limit: number };
      const entries = await this.leaderboardService.getTop(limit);
      new ApiResponse(res).success(entries);
    } catch (error) {
      next(error);
    }
  };
}
