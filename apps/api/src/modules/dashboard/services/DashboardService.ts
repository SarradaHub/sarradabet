import { cacheService } from "../../../core/cache/CacheService";

export async function invalidateDashboardCache(userId?: number): Promise<void> {
  if (userId != null) {
    cacheService.del(`dashboard:user:${userId}`);
  }

  cacheService.invalidatePattern("dashboard:");
}
