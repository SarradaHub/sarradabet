import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBetResolutionQueue } from "../useBetResolutionQueue";
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
    closesAt: rest.closesAt ?? null,
    startTime: rest.startTime ?? null,
    ...rest,
  };
}

describe("useBetResolutionQueue", () => {
  it("only counts eligible closed bets for selection", () => {
    const closedBet = makeBet({ id: 1, status: "closed" });
    const openBet = makeBet({
      id: 2,
      status: "open",
      closesAt: "2099-01-01T00:00:00.000Z",
    });
    const bets = [closedBet, openBet];

    const { result } = renderHook(() => useBetResolutionQueue(bets));

    act(() => {
      result.current.toggleSelection(openBet.id);
    });

    expect(result.current.selectedCount).toBe(0);

    act(() => {
      result.current.toggleSelection(closedBet.id);
    });

    expect(result.current.selectedCount).toBe(1);
  });

  it("starts queue only with eligible selections", () => {
    const closedBet = makeBet({ id: 1, status: "closed" });
    const openBet = makeBet({
      id: 2,
      status: "open",
      closesAt: "2099-01-01T00:00:00.000Z",
    });
    const bets = [closedBet, openBet];

    const { result } = renderHook(() => useBetResolutionQueue(bets));

    act(() => {
      result.current.startQueue([openBet.id]);
    });

    expect(result.current.isQueueActive).toBe(false);
    expect(result.current.selectionError).toBeTruthy();

    act(() => {
      result.current.startQueue([closedBet.id]);
    });

    expect(result.current.isQueueActive).toBe(true);
    expect(result.current.currentBet?.id).toBe(closedBet.id);
  });

  it("select-all respects visible bets scope", () => {
    const closedVisible = makeBet({ id: 1, status: "closed", title: "Visible" });
    const closedHidden = makeBet({ id: 2, status: "closed", title: "Hidden" });
    const bets = [closedVisible, closedHidden];
    const visibleBets = [closedVisible];

    const { result } = renderHook(() =>
      useBetResolutionQueue(bets, visibleBets),
    );

    act(() => {
      result.current.toggleSelectAll();
    });

    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected(closedVisible.id)).toBe(true);
    expect(result.current.isSelected(closedHidden.id)).toBe(false);
  });
});
