import { UserStatsRepository } from "../repositories/UserStatsRepository";
import { UserStatsService } from "../services/UserStatsService";
import { LeaderboardService } from "../services/LeaderboardService";

describe("UserStatsService", () => {
  const repository = new UserStatsRepository();
  const leaderboardService = new LeaderboardService(repository);
  const service = new UserStatsService(repository, leaderboardService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records a win and increments totals", async () => {
    jest.spyOn(repository, "findByUserId").mockResolvedValue({
      userId: 1,
      totalBets: 2,
      wonBets: 1,
      lostBets: 1,
      winRate: 0.5,
      rankingScore: 20,
      updatedAt: new Date(),
    } as never);

    jest.spyOn(repository, "upsert").mockResolvedValue({
      userId: 1,
      totalBets: 3,
      wonBets: 2,
      lostBets: 1,
      winRate: 2 / 3,
      rankingScore: 40,
      updatedAt: new Date(),
    } as never);

    const invalidateSpy = jest
      .spyOn(leaderboardService, "invalidateCache")
      .mockResolvedValue();

    const result = await service.recordWin(1, 200);

    expect(repository.upsert).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        totalBets: 3,
        wonBets: 2,
        lostBets: 1,
      }),
    );
    expect(invalidateSpy).toHaveBeenCalled();
    expect(result.totalBets).toBe(3);
  });

  it("records a loss and increments lost bets", async () => {
    jest.spyOn(repository, "findByUserId").mockResolvedValue(null);
    jest.spyOn(repository, "getCoinBalance").mockResolvedValue(100);
    jest.spyOn(repository, "upsert").mockResolvedValue({
      userId: 2,
      totalBets: 1,
      wonBets: 0,
      lostBets: 1,
      winRate: 0,
      rankingScore: 10,
      updatedAt: new Date(),
    } as never);
    jest
      .spyOn(leaderboardService, "invalidateCache")
      .mockResolvedValue();

    const result = await service.recordLoss(2);

    expect(result.lostBets).toBe(1);
    expect(result.winRate).toBe(0);
  });
});
