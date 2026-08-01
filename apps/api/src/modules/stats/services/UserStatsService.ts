/** Feature 04 hook — stats persistence deferred; no-op until implemented. */
export class UserStatsService {
  async recordWin(_userId: number, _newBalance?: number): Promise<void> {}

  async recordLoss(_userId: number): Promise<void> {}
}
