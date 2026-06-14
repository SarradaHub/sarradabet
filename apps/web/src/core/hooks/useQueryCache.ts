// Simple query cache to prevent duplicate requests
class QueryCache {
  private cache = new Map<
    string,
    { data?: unknown; dataTimestamp?: number; promise?: Promise<unknown> }
  >();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (
      cached !== undefined &&
      cached.dataTimestamp !== undefined &&
      Date.now() - cached.dataTimestamp < this.CACHE_DURATION &&
      cached.data !== undefined
    ) {
      return cached.data as T;
    }
    return null;
  }

  set<T>(key: string, data: T) {
    const existing = this.cache.get(key);
    const promise = existing?.promise;
    this.cache.set(key, { data, dataTimestamp: Date.now(), promise });
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    return (
      cached !== undefined &&
      cached.dataTimestamp !== undefined &&
      Date.now() - cached.dataTimestamp < this.CACHE_DURATION &&
      cached.data !== undefined
    );
  }

  isPending(key: string): boolean {
    const cached = this.cache.get(key);
    return cached !== undefined && cached.promise !== undefined;
  }

  setPending<T>(key: string, promise: Promise<T | null>) {
    const existing = this.cache.get(key);
    this.cache.set(key, {
      data: existing?.data,
      dataTimestamp: existing?.dataTimestamp,
      promise,
    });
    promise.finally(() => {
      const current = this.cache.get(key);
      if (current && current.promise === promise) {
        current.promise = undefined;
      }
    });
  }

  getPending<T>(key: string): Promise<T | null> | undefined {
    const cached = this.cache.get(key);
    return cached?.promise as Promise<T | null> | undefined;
  }

  clearPending(key: string) {
    const cached = this.cache.get(key);
    if (cached) {
      cached.promise = undefined;
    }
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  keysMatching(prefix: string): string[] {
    return Array.from(this.cache.keys()).filter((key) => key.startsWith(prefix));
  }

  getRaw<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached?.data !== undefined) {
      return cached.data as T;
    }
    return null;
  }

  updateData<T>(key: string, updater: (data: T) => T): void {
    const cached = this.cache.get(key);
    if (cached?.data !== undefined) {
      this.set(key, updater(cached.data as T));
    }
  }

  updateByPrefix<T>(
    prefix: string,
    updater: (key: string, data: T) => T | null,
  ): void {
    for (const key of this.keysMatching(prefix)) {
      const data = this.getRaw<T>(key);
      if (data !== null) {
        const updated = updater(key, data);
        if (updated !== null) {
          this.set(key, updated);
        }
      }
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      const hasValidData =
        value.dataTimestamp !== undefined &&
        value.data !== undefined &&
        now - value.dataTimestamp < this.CACHE_DURATION;
      const hasPending = value.promise !== undefined;

      if (!hasValidData && !hasPending) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new QueryCache();

setInterval(() => {
  queryCache.cleanup();
}, 60 * 1000);
