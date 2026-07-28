import { AnalyticsRepository } from "../repositories/AnalyticsRepository";
import { AnalyticsService } from "../services/AnalyticsService";

describe("AnalyticsService", () => {
  const repository = new AnalyticsRepository();
  const service = new AnalyticsService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns overview metrics from repository", async () => {
    jest.spyOn(repository, "getOverview").mockResolvedValue({
      activeUsers: 2,
      totalBets: 10,
      totalCoinVolume: 500,
      pixRevenue: 99.9,
      averageBetsPerUser: 5,
    });

    const result = await service.getOverview({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });

    expect(result.totalBets).toBe(10);
    expect(result.pixRevenue).toBe(99.9);
  });

  it("passes category filter to bets-by-category", async () => {
    const spy = jest.spyOn(repository, "getBetsByCategory").mockResolvedValue([
      {
        categoryId: 1,
        categoryName: "Futebol",
        betCount: 3,
        coinVolume: 120,
      },
    ]);

    const rows = await service.getBetsByCategory({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      categoryId: 1,
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 1 }),
    );
    expect(rows[0]?.categoryName).toBe("Futebol");
  });

  it("returns 24 peak-hour buckets", async () => {
    jest.spyOn(repository, "getPeakHours").mockResolvedValue(
      Array.from({ length: 24 }, (_, hour) => ({ hour, betCount: 0 })),
    );

    const hours = await service.getPeakHours({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });

    expect(hours).toHaveLength(24);
  });
});
