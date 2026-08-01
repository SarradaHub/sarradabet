import { describe, it, expect, beforeEach } from "vitest";
import { queryCache } from "../../core/hooks/useQueryCache";
import {
  optimisticPatchFromVote,
  patchBetsFromVote,
  restoreBetsCache,
  snapshotBetsCache,
} from "../betCache";

describe("betCache", () => {
  beforeEach(() => {
    queryCache.clear();
  });

  it("patches bet odds from vote payload", () => {
    queryCache.set("bets-{}", {
      data: [
        {
          id: 10,
          title: "Match",
          totalVotes: 2,
          odds: [
            { id: 101, title: "Home", value: 2, totalVotes: 1, totalStake: 10 },
            { id: 102, title: "Away", value: 2, totalVotes: 1, totalStake: 5 },
          ],
        },
        {
          id: 20,
          title: "Other",
          totalVotes: 0,
          odds: [{ id: 201, title: "A", value: 2, totalVotes: 0, totalStake: 0 }],
        },
      ],
    });

    patchBetsFromVote({
      betId: 10,
      oddId: 101,
      totalVotes: 3,
      totalStake: 25,
      odds: [
        { id: 101, totalVotes: 2, totalStake: 20, value: 1.5 },
        { id: 102, totalVotes: 1, totalStake: 5, value: 3 },
      ],
    });

    const cached = queryCache.getRaw<{
      data: Array<{
        id: number;
        totalVotes: number;
        odds: Array<{ id: number; value: number; totalVotes: number; totalStake: number }>;
      }>;
    }>("bets-{}");

    expect(cached?.data[0].totalVotes).toBe(3);
    expect(cached?.data[0].odds[0]).toEqual({
      id: 101,
      title: "Home",
      value: 1.5,
      totalVotes: 2,
      totalStake: 20,
    });
    expect(cached?.data[0].odds[1].value).toBe(3);
    expect(cached?.data[1].totalVotes).toBe(0);
  });

  it("applies optimistic vote patch and restores snapshot on rollback", () => {
    queryCache.set("bets-{}", {
      data: [
        {
          id: 10,
          title: "Match",
          totalVotes: 2,
          totalStake: 15,
          odds: [
            { id: 101, title: "Home", value: 2, totalVotes: 1, totalStake: 10 },
            { id: 102, title: "Away", value: 2, totalVotes: 1, totalStake: 5 },
          ],
        },
      ],
    });

    const snapshot = snapshotBetsCache();

    optimisticPatchFromVote({ betId: 10, oddId: 101, amount: 25 });

    const patched = queryCache.getRaw<{
      data: Array<{
        totalVotes: number;
        totalStake: number;
        odds: Array<{ id: number; totalVotes: number; totalStake: number }>;
      }>;
    }>("bets-{}");

    expect(patched?.data[0].totalVotes).toBe(3);
    expect(patched?.data[0].totalStake).toBe(40);
    expect(patched?.data[0].odds[0].totalVotes).toBe(2);
    expect(patched?.data[0].odds[0].totalStake).toBe(35);

    restoreBetsCache(snapshot);

    const restored = queryCache.getRaw<{
      data: Array<{
        totalVotes: number;
        totalStake: number;
        odds: Array<{ id: number; totalVotes: number; totalStake: number }>;
      }>;
    }>("bets-{}");

    expect(restored?.data[0].totalVotes).toBe(2);
    expect(restored?.data[0].totalStake).toBe(15);
    expect(restored?.data[0].odds[0].totalStake).toBe(10);
  });
});
