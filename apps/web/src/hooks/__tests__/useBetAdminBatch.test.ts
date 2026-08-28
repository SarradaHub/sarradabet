import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBetAdminBatch } from "../useBetAdminBatch";
import type { Bet } from "../../types/bet";

function makeBet(overrides: Partial<Bet> & Pick<Bet, "id" | "status">): Bet {
  const { id, status, ...rest } = overrides;
  return {
    id,
    title: rest.title ?? `Bet ${id}`,
    status,
    categoryId: 1,
    odds: [
      { id: 1, title: "A", value: 2, totalVotes: 0, totalStake: 0 },
      { id: 2, title: "B", value: 2, totalVotes: 0, totalStake: 0 },
    ],
    totalVotes: 0,
    totalStake: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    closesAt: rest.closesAt ?? "2099-01-01T00:00:00.000Z",
    startTime: rest.startTime ?? null,
    ...rest,
  };
}

describe("useBetAdminBatch", () => {
  it("tracks closable and resolvable selections separately", () => {
    const openBet = makeBet({ id: 1, status: "open" });
    const closedBet = makeBet({ id: 2, status: "closed" });
    const bets = [openBet, closedBet];

    const { result } = renderHook(() => useBetAdminBatch(bets));

    act(() => {
      result.current.toggleSelection(openBet.id);
      result.current.toggleSelection(closedBet.id);
    });

    expect(result.current.selectedCloseCount).toBe(1);
    expect(result.current.selectedResolveCount).toBe(1);
  });

  it("starts resolve queue only for resolvable bets", () => {
    const openBet = makeBet({ id: 1, status: "open" });
    const closedBet = makeBet({ id: 2, status: "closed" });
    const bets = [openBet, closedBet];

    const { result } = renderHook(() => useBetAdminBatch(bets));

    act(() => {
      result.current.startResolveQueue([openBet.id]);
    });

    expect(result.current.isQueueActive).toBe(false);

    act(() => {
      result.current.startResolveQueue([closedBet.id]);
    });

    expect(result.current.isQueueActive).toBe(true);
    expect(result.current.currentBet?.id).toBe(closedBet.id);
  });
});
