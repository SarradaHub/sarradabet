import { CoinTransactionSource } from "@prisma/client";
import { BadRequestError, ConflictError } from "../../../core/errors/AppError";
import { prisma } from "../../../config/db";
import { CoinRepository } from "../../coin/repositories/CoinRepository";
import { UserStatsService } from "../../stats/services/UserStatsService";
import { RewardRepository } from "../repositories/RewardRepository";
import { RewardService } from "../services/RewardService";

jest.mock("../../../config/db", () => ({
  prisma: {
    $transaction: jest.fn(),
    rewardRedemption: {
      update: jest.fn(),
    },
  },
}));

jest.mock("../../../realtime/emitter", () => ({
  emitRewardValidated: jest.fn(),
}));

describe("RewardService", () => {
  const repository = new RewardRepository();
  const coinRepository = new CoinRepository();
  const userStatsService = new UserStatsService();
  const service = new RewardService(
    repository,
    coinRepository,
    userStatsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects negative stock on create", async () => {
    await expect(
      service.create({
        title: "Camisa",
        coinCost: 1000,
        stock: -1,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it("lists pending redemptions for a user", async () => {
    jest.spyOn(repository, "findPendingByUserId").mockResolvedValue([
      {
        id: 1,
        rewardId: 2,
        userId: 10,
        ticketCode: "abc-123",
        redeemedAt: new Date("2026-07-15"),
        validatedAt: null,
        validatedBy: null,
        reward: {
          id: 2,
          title: "Caneca Exclusiva",
          description: "Edição limitada",
          coinCost: 250,
          imageUrl: null,
        },
      },
    ] as never);

    const result = await service.listMyPendingRedemptions(10);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ticketCode: "abc-123",
      validatedAt: null,
      reward: { title: "Caneca Exclusiva", coinCost: 250 },
    });
  });

  it("lists validated redemptions for a user", async () => {
    jest.spyOn(repository, "findValidatedByUserId").mockResolvedValue([
      {
        id: 2,
        rewardId: 3,
        userId: 10,
        ticketCode: "def-456",
        redeemedAt: new Date("2026-07-10"),
        validatedAt: new Date("2026-07-16"),
        validatedBy: 99,
        reward: {
          id: 3,
          title: "Camisa Exclusiva",
          description: null,
          coinCost: 1000,
          imageUrl: null,
        },
      },
    ] as never);

    const result = await service.listMyValidatedRedemptions(10);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ticketCode: "def-456",
      validatedAt: "2026-07-16T00:00:00.000Z",
      reward: { title: "Camisa Exclusiva" },
    });
  });

  it("rejects redeem when reward is inactive", async () => {
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          reward: {
            findUnique: jest.fn().mockResolvedValue({
              id: 1,
              title: "Camisa",
              isActive: false,
              stock: 5,
              coinCost: 1000,
            }),
          },
        }),
    );

    await expect(service.redeem(1, 10)).rejects.toThrow(
      "Recompensa não está disponível",
    );
  });

  it("rejects validating an already validated ticket", async () => {
    jest.spyOn(repository, "findRedemptionByTicketCode").mockResolvedValue({
      id: 1,
      rewardId: 1,
      userId: 10,
      ticketCode: "abc-123",
      redeemedAt: new Date(),
      validatedAt: new Date(),
      validatedBy: 99,
      reward: { title: "Camisa" },
      user: { id: 10, username: "player" },
    } as never);

    await expect(service.validateTicket("abc-123", 99)).rejects.toThrow(
      ConflictError,
    );
  });

  it("debits coins and creates ticket on successful redeem", async () => {
    const ticketCode = "11111111-1111-1111-1111-111111111111";

    jest.spyOn(coinRepository, "debitCoins").mockResolvedValue({
      balanceAfter: 500,
    } as never);
    jest
      .spyOn(userStatsService, "recalculateScore")
      .mockResolvedValue({} as never);

    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          reward: {
            findUnique: jest.fn().mockResolvedValue({
              id: 1,
              title: "Camisa",
              isActive: true,
              stock: 5,
              coinCost: 1000,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: jest.fn().mockResolvedValue({
              id: 1,
              title: "Camisa",
              description: null,
              coinCost: 1000,
              stock: 4,
              imageUrl: null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
          rewardRedemption: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              rewardId: 1,
              userId: 10,
              ticketCode,
              redeemedAt: new Date(),
              validatedAt: null,
              validatedBy: null,
            }),
          },
        };

        return callback(tx);
      },
    );

    const result = await service.redeem(1, 10);

    expect(result.ticketCode).toBe(ticketCode);
    expect(result.newBalance).toBe(500);
    expect(coinRepository.debitCoins).toHaveBeenCalledWith(
      expect.anything(),
      10,
      1000,
      expect.objectContaining({
        source: CoinTransactionSource.REWARD_REDEMPTION,
      }),
    );
  });
});
