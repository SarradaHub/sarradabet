import { Request, Response, NextFunction } from "express";
import { createVote } from "../services/vote.service";
import { ApiResponse } from "../utils/api/response";
import { UnauthorizedError } from "../core/errors/AppError";

export const createVoteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await createVote(req.body, req.user.userId);
    new ApiResponse(res).success(
      {
        vote: result.vote,
        betId: result.betId,
        odds: result.odds,
        totalVotes: result.totalVotes,
        totalStake: result.totalStake,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};
