import {
  applyTakeoutToOdd,
  calculateOddsFromVotes,
  targetImpliedProbabilityTotal,
} from "../odds";

describe("calculateOddsFromVotes", () => {
  it("returns equal takeout-adjusted odds when there are no votes", () => {
    expect(calculateOddsFromVotes([0, 0])).toEqual([
      applyTakeoutToOdd(2),
      applyTakeoutToOdd(2),
    ]);
    expect(calculateOddsFromVotes([0, 0, 0])).toEqual([
      applyTakeoutToOdd(3),
      applyTakeoutToOdd(3),
      applyTakeoutToOdd(3),
    ]);
  });

  it("lowers odds for outcomes with more votes", () => {
    const odds = calculateOddsFromVotes([10, 2]);
    expect(odds[0]).toBeLessThan(odds[1]);
  });

  it("clamps favorite odds to minimum 1.01", () => {
    const odds = calculateOddsFromVotes([1000, 0]);
    expect(odds[0]).toBe(1.01);
    expect(odds[1]).toBeGreaterThan(1.01);
  });

  it("produces a takeout-adjusted book where implied probabilities sum to target", () => {
    const odds = calculateOddsFromVotes([5, 3, 1]);
    const impliedSum = odds.reduce((sum, value) => sum + 1 / value, 0);
    expect(impliedSum).toBeCloseTo(targetImpliedProbabilityTotal(), 2);
  });

  it("returns empty array for empty input", () => {
    expect(calculateOddsFromVotes([])).toEqual([]);
  });
});
