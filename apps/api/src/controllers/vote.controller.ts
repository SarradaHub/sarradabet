import { Request, Response, NextFunction } from "express";
import { createVoteWithOdds } from "../repositories/vote.repository";
import { ApiResponse } from "../utils/api/response";
import { EventGatewayClient } from "../services/events/EventGatewayClient";
import { wagerAcceptedPayload } from "../services/events/EventFactory";

const eventGateway = new EventGatewayClient();

export const createVote = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newVote = await createVoteWithOdds(req.body);

    await eventGateway
      .publish(
        "betting.wager.accepted.v1",
        wagerAcceptedPayload({
          wagerId: newVote.id.toString(),
          betId: newVote.odd.bet.id.toString(),
          oddId: newVote.oddId.toString(),
          stake: 10,
          potentialPayout: 10 * newVote.odd.value,
        }),
      )
      .catch(() => undefined);

    new ApiResponse(res).success(newVote, 201);
  } catch (error) {
    next(error);
  }
};
