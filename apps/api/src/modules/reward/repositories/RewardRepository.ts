import { Reward, RewardRedemption } from "@prisma/client";
import { prisma } from "../../../config/db";
import {
  CreateRewardInput,
  UpdateRewardInput,
} from "../../../core/validation/ValidationSchemas";

export class RewardRepository {
  async findActive() {
    return prisma.reward.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: [{ coinCost: "asc" }, { id: "asc" }],
    });
  }

  async findAll() {
    return prisma.reward.findMany({
      orderBy: [{ id: "asc" }],
    });
  }

  async findById(id: number) {
    return prisma.reward.findUnique({ where: { id } });
  }

  async findActiveById(id: number) {
    return prisma.reward.findFirst({
      where: { id, isActive: true, stock: { gt: 0 } },
    });
  }

  async create(data: CreateRewardInput) {
    return prisma.reward.create({
      data: {
        title: data.title,
        description: data.description,
        coinCost: data.coinCost,
        stock: data.stock,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: number, data: UpdateRewardInput) {
    return prisma.reward.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: number) {
    return prisma.reward.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findRedemptionByTicketCode(ticketCode: string) {
    return prisma.rewardRedemption.findUnique({
      where: { ticketCode },
      include: { reward: true, user: { select: { id: true, username: true, email: true } } },
    });
  }

  toRewardDto(reward: Reward) {
    return {
      id: reward.id,
      title: reward.title,
      description: reward.description,
      coinCost: reward.coinCost,
      stock: reward.stock,
      imageUrl: reward.imageUrl,
      isActive: reward.isActive,
      createdAt: reward.createdAt.toISOString(),
      updatedAt: reward.updatedAt.toISOString(),
    };
  }

  toRedemptionDto(redemption: RewardRedemption) {
    return {
      id: redemption.id,
      rewardId: redemption.rewardId,
      userId: redemption.userId,
      ticketCode: redemption.ticketCode,
      redeemedAt: redemption.redeemedAt.toISOString(),
      validatedAt: redemption.validatedAt?.toISOString() ?? null,
      validatedBy: redemption.validatedBy,
    };
  }

  async findPendingByUserId(userId: number) {
    return this.findRedemptionsByUserId(userId, "pending");
  }

  async findValidatedByUserId(userId: number) {
    return this.findRedemptionsByUserId(userId, "validated");
  }

  private async findRedemptionsByUserId(
    userId: number,
    status: "pending" | "validated",
  ) {
    return prisma.rewardRedemption.findMany({
      where: {
        userId,
        validatedAt: status === "pending" ? null : { not: null },
      },
      orderBy:
        status === "pending"
          ? { redeemedAt: "desc" }
          : { validatedAt: "desc" },
      include: {
        reward: {
          select: {
            id: true,
            title: true,
            description: true,
            coinCost: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  toUserRedemptionDto(
    redemption: RewardRedemption & {
      reward: {
        id: number;
        title: string;
        description: string | null;
        coinCost: number;
        imageUrl: string | null;
      };
    },
  ) {
    return {
      id: redemption.id,
      ticketCode: redemption.ticketCode,
      redeemedAt: redemption.redeemedAt.toISOString(),
      validatedAt: redemption.validatedAt?.toISOString() ?? null,
      reward: {
        id: redemption.reward.id,
        title: redemption.reward.title,
        description: redemption.reward.description,
        coinCost: redemption.reward.coinCost,
        imageUrl: redemption.reward.imageUrl,
      },
    };
  }
}
