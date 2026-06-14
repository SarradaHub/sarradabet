import { Request, Response, NextFunction } from "express";
import { createVote } from "../services/vote.service";
import { ApiResponse } from "../utils/api/response";

export const createVoteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await createVote(req.body);
    new ApiResponse(res).success(
      {
        vote: result.vote,
        betId: result.betId,
        odds: result.odds,
        totalVotes: result.totalVotes,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};
