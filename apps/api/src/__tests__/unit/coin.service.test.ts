import { CoinTransactionSource } from "@prisma/client";
import { CoinRepository } from "../../modules/coin/repositories/CoinRepository";
import { CoinService } from "../../modules/coin/services/CoinService";
import { prisma } from "../../config/db";

jest.mock("../../config/db", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

describe("CoinService", () => {
  const repository = new CoinRepository();
  const service = new CoinService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns existing transaction when externalId already exists", async () => {
    const existing = {
      id: 1,
      userId: 10,
      type: "CREDIT",
      amount: 100,
      balanceAfter: 100,
      source: CoinTransactionSource.PIX_PURCHASE,
      referenceId: 5,
      externalId: "mp_payment_123",
      description: null,
      createdAt: new Date(),
    };

    jest
      .spyOn(repository, "findTransactionByExternalId")
      .mockResolvedValue(existing as never);

    const result = await service.creditCoins(10, 100, {
      source: CoinTransactionSource.PIX_PURCHASE,
      externalId: "mp_payment_123",
    });

    expect(result).toEqual(existing);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("throws when debiting more than available balance", async () => {
    jest.spyOn(repository, "debitCoins").mockImplementation(() => {
      throw new Error("INSUFFICIENT_BALANCE");
    });

    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback({}),
    );

    await expect(
      service.debitCoins(10, 50, {
        source: CoinTransactionSource.BET_COST,
      }),
    ).rejects.toThrow("Insufficient coin balance");
  });
});
