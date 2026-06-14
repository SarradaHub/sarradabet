import NodeCache from "node-cache";

class CacheService {
  private cache = new NodeCache({
    stdTTL: 300,
    checkperiod: 60,
    useClones: false,
  });

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    if (ttlSeconds !== undefined) {
      this.cache.set(key, value, ttlSeconds);
    } else {
      this.cache.set(key, value);
    }
  }

  del(key: string): void {
    this.cache.del(key);
  }

  invalidatePattern(prefix: string): void {
    const keys = this.cache.keys().filter((key) => key.startsWith(prefix));
    if (keys.length > 0) {
      this.cache.del(keys);
    }
  }

  invalidateBet(betId: number): void {
    this.del(`bet:${betId}`);
    this.invalidatePattern("bets:");
  }

  invalidateCategories(): void {
    this.invalidatePattern("categories:");
  }
}

export const cacheService = new CacheService();
