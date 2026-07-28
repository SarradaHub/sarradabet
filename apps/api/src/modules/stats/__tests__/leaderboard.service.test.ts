import { LeaderboardService } from "../services/LeaderboardService";
import { UserStatsRepository } from "../repositories/UserStatsRepository";

jest.mock("../../../config/redis", () => ({
  getRedisClient: jest.fn(() => null),
}));

describe("LeaderboardService", () => {
  const repository = new UserStatsRepository();
  const service = new LeaderboardService(repository);

  it("returns leaderboard entries ordered by repository", async () => {
    jest.spyOn(repository, "getTop").mockResolvedValue([
      {
        userId: 1,
        totalBets: 5,
        wonBets: 3,
        lostBets: 2,
        winRate: 0.6,
        rankingScore: 80,
        updatedAt: new Date(),
        user: { id: 10, username: "player1" },
      },
      {
        userId: 2,
        totalBets: 4,
        wonBets: 2,
        lostBets: 2,
        winRate: 0.5,
        rankingScore: 40,
        updatedAt: new Date(),
        user: { id: 11, username: "player2" },
      },
    ] as never);

    const entries = await service.getTop(100);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      rank: 1,
      userId: 10,
      username: "player1",
      rankingScore: 80,
    });
    expect(entries[1].rank).toBe(2);
  });
});
