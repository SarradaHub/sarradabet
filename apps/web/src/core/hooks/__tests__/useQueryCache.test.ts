import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryCache } from "../useQueryCache";

describe("QueryCache", () => {
  beforeEach(() => {
    queryCache.clear();
  });

  it("notifies subscribers on set", () => {
    const listener = vi.fn();
    queryCache.subscribe(listener);

    queryCache.set("bets-{}", [{ id: 1 }]);

    expect(listener).toHaveBeenCalledWith({
      type: "set",
      keys: ["bets-{}"],
    });
  });

  it("notifies subscribers on updateByPrefix", () => {
    queryCache.set("bets-{}", { data: [{ id: 1, totalVotes: 0 }] });

    const listener = vi.fn();
    queryCache.subscribe(listener);

    queryCache.updateByPrefix("bets-", (_key, data) => {
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === "object" && "data" in data) {
        return {
          ...data,
          data: (data.data as { id: number }[]).map((bet) => ({
            ...bet,
            totalVotes: 5,
          })),
        };
      }
      return data;
    });

    expect(listener).toHaveBeenCalledWith({
      type: "update",
      keys: ["bets-{}"],
    });
  });

  it("notifies subscribers on clearByPrefix", () => {
    queryCache.set("bets-{}", [{ id: 1 }]);
    queryCache.set("bets-status-open", [{ id: 2 }]);
    queryCache.set("categories-{}", [{ id: 3 }]);

    const listener = vi.fn();
    queryCache.subscribe(listener);

    queryCache.clearByPrefix("bets-");

    expect(listener).toHaveBeenCalledWith({
      type: "clear",
      keys: ["bets-{}", "bets-status-open"],
    });
    expect(queryCache.get("bets-{}")).toBe(null);
    expect(queryCache.get("categories-{}")).not.toBe(null);
  });

  it("unsubscribes listener", () => {
    const listener = vi.fn();
    const unsubscribe = queryCache.subscribe(listener);
    unsubscribe();

    queryCache.set("test-key", "value");

    expect(listener).not.toHaveBeenCalled();
  });
});
