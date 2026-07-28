import { UserStatsRepository } from "../repositories/UserStatsRepository";
import { LeaderboardService } from "./LeaderboardService";
import { invalidateDashboardCache } from "../../dashboard/services/DashboardService";

export class UserStatsService {
  constructor(
    private readonly repository: UserStatsRepository = new UserStatsRepository(),
    private readonly leaderboardService: LeaderboardService = new LeaderboardService(),
  ) {}

  async getByUserId(userId: number) {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      return this.repository.toDto(existing);
    }

    const created = await this.repository.upsert(userId, {
      totalBets: 0,
      wonBets: 0,
      lostBets: 0,
      winRate: 0,
      rankingScore: 0,
    });
    return this.repository.toDto(created);
  }

  async recordWin(userId: number, coinBalance?: number) {
    const balance =
      coinBalance ?? (await this.repository.getCoinBalance(userId));
    const current = await this.repository.findByUserId(userId);
    const totalBets = (current?.totalBets ?? 0) + 1;
    const wonBets = (current?.wonBets ?? 0) + 1;
    const lostBets = current?.lostBets ?? 0;

    const stats = await this.repository.upsert(
      userId,
      this.repository.buildStatsPayload(
        totalBets,
        wonBets,
        lostBets,
        balance,
      ),
    );

    await this.leaderboardService.invalidateCache();
    await invalidateDashboardCache(userId);
    return this.repository.toDto(stats);
  }

  async recordLoss(userId: number, coinBalance?: number) {
    const balance =
      coinBalance ?? (await this.repository.getCoinBalance(userId));
    const current = await this.repository.findByUserId(userId);
    const totalBets = (current?.totalBets ?? 0) + 1;
    const wonBets = current?.wonBets ?? 0;
    const lostBets = (current?.lostBets ?? 0) + 1;

    const stats = await this.repository.upsert(
      userId,
      this.repository.buildStatsPayload(
        totalBets,
        wonBets,
        lostBets,
        balance,
      ),
    );

    await this.leaderboardService.invalidateCache();
    await invalidateDashboardCache(userId);
    return this.repository.toDto(stats);
  }

  async recalculateScore(userId: number) {
    const current = await this.repository.findByUserId(userId);
    if (!current) {
      return this.getByUserId(userId);
    }

    const balance = await this.repository.getCoinBalance(userId);
    const stats = await this.repository.upsert(
      userId,
      this.repository.buildStatsPayload(
        current.totalBets,
        current.wonBets,
        current.lostBets,
        balance,
      ),
    );

    await this.leaderboardService.invalidateCache();
    await invalidateDashboardCache(userId);
    return this.repository.toDto(stats);
  }
}
