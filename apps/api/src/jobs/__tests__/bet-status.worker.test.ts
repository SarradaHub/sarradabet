import { calculatePayout, netPool } from "../../utils/parimutuel";

jest.mock("../../config/db", () => ({
  prisma: {
    bet: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("../../modules/bet/repositories/BetRepository", () => ({
  BetRepository: jest.fn().mockImplementation(() => ({
    findUnique: jest.fn(),
  })),
}));

jest.mock("../../realtime/emitter", () => ({
  emitBetUpdated: jest.fn(),
}));

jest.mock("../../core/cache/CacheService", () => ({
  cacheService: {
    invalidatePattern: jest.fn(),
  },
}));

import { prisma } from "../../config/db";
import { BetRepository } from "../../modules/bet/repositories/BetRepository";
import { runBetStatusTransitions } from "../bet-status.worker";

describe("bet-status worker", () => {
  const findMany = prisma.bet.findMany as jest.Mock;
  const updateMany = prisma.bet.updateMany as jest.Mock;
  const findUnique = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (BetRepository as jest.Mock).mockImplementation(() => ({
      findUnique,
    }));
  });

  it("closes open bets whose closesAt has passed", async () => {
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 10 }]);
    updateMany.mockResolvedValue({ count: 1 });
    findUnique.mockResolvedValue({
      id: 10,
      title: "Expired",
      status: "closed",
    });

    const result = await runBetStatusTransitions();

    expect(result.closed).toBe(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { in: [10] } },
      data: { status: "closed" },
    });
  });

  it("documents parimutuel payout used by payout worker", () => {
    const totalPool = 500;
    const winningPool = 300;
    const stake = 100;

    expect(netPool(totalPool)).toBe(375);
    expect(calculatePayout(stake, totalPool, winningPool)).toBe(125);
  });
});
