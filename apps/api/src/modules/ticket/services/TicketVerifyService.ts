import type { TicketVerifyResponse } from "@sarradabet/types";
import { NotFoundError } from "../../../core/errors/AppError";
import { RewardRepository } from "../../reward/repositories/RewardRepository";
import { maskUserIdentity } from "../utils/maskUserIdentity";

export class TicketVerifyService {
  constructor(
    private readonly rewardRepository: RewardRepository = new RewardRepository(),
  ) {}

  async verify(ticketCode: string): Promise<TicketVerifyResponse> {
    const redemption =
      await this.rewardRepository.findRedemptionByTicketCode(ticketCode);

    if (!redemption) {
      throw new NotFoundError("Ticket");
    }

    const isValidated = redemption.validatedAt !== null;

    return {
      ticketCode: redemption.ticketCode,
      isValid: true,
      status: isValidated ? "VALIDATED" : "REDEEMED",
      rewardTitle: redemption.reward.title,
      userEmail: maskUserIdentity(
        redemption.user.email,
        redemption.user.username,
      ),
      redeemedAt: redemption.redeemedAt.toISOString(),
      validatedAt: redemption.validatedAt?.toISOString() ?? null,
    };
  }
}
