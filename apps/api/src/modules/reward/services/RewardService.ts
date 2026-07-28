import { randomUUID } from "node:crypto";
import { CoinTransactionSource } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../core/errors/AppError";
import {
  CreateRewardInput,
  UpdateRewardInput,
} from "../../../core/validation/ValidationSchemas";
import { prisma } from "../../../config/db";
import { CoinRepository } from "../../coin/repositories/CoinRepository";
import { emitRewardValidated } from "../../../realtime/emitter";
import {
  buildTicketImageUrl,
  buildValidateImageUrl,
} from "../../ticket/services/TicketImageCacheService";
import { UserStatsService } from "../../stats/services/UserStatsService";
import { RewardRepository } from "../repositories/RewardRepository";

export class RewardService {
  constructor(
    private readonly repository: RewardRepository = new RewardRepository(),
    private readonly coinRepository: CoinRepository = new CoinRepository(),
    private readonly userStatsService: UserStatsService = new UserStatsService(),
  ) {}

  listActive() {
    return this.repository.findActive().then((rewards) =>
      rewards.map((reward) => this.repository.toRewardDto(reward)),
    );
  }

  listAll() {
    return this.repository.findAll().then((rewards) =>
      rewards.map((reward) => this.repository.toRewardDto(reward)),
    );
  }

  listMyPendingRedemptions(userId: number) {
    return this.listRedemptionsByStatus(userId, "pending");
  }

  listMyValidatedRedemptions(userId: number) {
    return this.listRedemptionsByStatus(userId, "validated");
  }

  private listRedemptionsByStatus(
    userId: number,
    status: "pending" | "validated",
  ) {
    const finder =
      status === "pending"
        ? this.repository.findPendingByUserId(userId)
        : this.repository.findValidatedByUserId(userId);

    return finder.then((redemptions) =>
      redemptions.map((redemption) =>
        this.repository.toUserRedemptionDto(redemption),
      ),
    );
  }

  async create(data: CreateRewardInput) {
    this.validateStock(data.stock);
    const reward = await this.repository.create(data);
    return this.repository.toRewardDto(reward);
  }

  async update(id: number, data: UpdateRewardInput) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Reward", id);
    }

    if (data.stock !== undefined) {
      this.validateStock(data.stock);
    }

    const reward = await this.repository.update(id, data);
    return this.repository.toRewardDto(reward);
  }

  async deactivate(id: number) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Reward", id);
    }

    const reward = await this.repository.deactivate(id);
    return this.repository.toRewardDto(reward);
  }

  async redeem(rewardId: number, userId: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const reward = await tx.reward.findUnique({ where: { id: rewardId } });

        if (!reward || !reward.isActive) {
          throw new BadRequestError("Recompensa não está disponível");
        }

        if (reward.stock <= 0) {
          throw new BadRequestError("Recompensa sem estoque disponível");
        }

        const stockUpdate = await tx.reward.updateMany({
          where: { id: rewardId, stock: { gt: 0 }, isActive: true },
          data: { stock: { decrement: 1 } },
        });

        if (stockUpdate.count === 0) {
          throw new BadRequestError("Estoque esgotado");
        }

        const ticketCode = randomUUID();
        let transaction;

        try {
          transaction = await this.coinRepository.debitCoins(
            tx,
            userId,
            reward.coinCost,
            {
              source: CoinTransactionSource.REWARD_REDEMPTION,
              referenceId: rewardId,
              externalId: `reward:${rewardId}:${ticketCode}`,
              description: `Resgate: ${reward.title}`,
            },
          );
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "INSUFFICIENT_BALANCE"
          ) {
            throw new BadRequestError("Saldo insuficiente");
          }
          throw new BadRequestError("Falha no resgate, tente novamente");
        }

        const redemption = await tx.rewardRedemption.create({
          data: {
            rewardId,
            userId,
            ticketCode,
          },
        });

        const updatedReward = await tx.reward.findUniqueOrThrow({
          where: { id: rewardId },
        });

        return {
          ticketCode: redemption.ticketCode,
          reward: this.repository.toRewardDto(updatedReward),
          newBalance: transaction.balanceAfter,
          ticketImageUrl: buildTicketImageUrl(redemption.ticketCode),
        };
      });

      await this.userStatsService.recalculateScore(userId);
      return result;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError("Falha no resgate, tente novamente");
    }
  }

  async validateTicket(ticketCode: string, adminUserId: number) {
    const redemption = await this.repository.findRedemptionByTicketCode(
      ticketCode,
    );

    if (!redemption) {
      throw new NotFoundError("Ticket");
    }

    if (redemption.validatedAt) {
      throw new ConflictError("Ticket já foi validado anteriormente");
    }

    const validatedAt = new Date();
    const updated = await prisma.rewardRedemption.update({
      where: { ticketCode },
      data: {
        validatedAt,
        validatedBy: adminUserId,
      },
    });

    emitRewardValidated(redemption.userId, {
      redemptionId: updated.id,
      rewardTitle: redemption.reward.title,
      ticketCode: updated.ticketCode,
      redeemedAt: redemption.redeemedAt.toISOString(),
      validatedAt: validatedAt.toISOString(),
    });

    return {
      valid: true,
      message: "Ticket validado com sucesso",
      redemption: this.repository.toRedemptionDto(updated),
      rewardTitle: redemption.reward.title,
      username: redemption.user.username,
      redeemedAt: redemption.redeemedAt.toISOString(),
      validatedAt: validatedAt.toISOString(),
      validateImageUrl: buildValidateImageUrl(updated.ticketCode),
    };
  }

  private validateStock(stock: number) {
    if (stock < 0) {
      throw new BadRequestError("Stock não pode ser negativo");
    }
  }
}
