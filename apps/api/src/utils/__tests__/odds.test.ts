import { calculateOddsFromVotes } from "../odds";

describe("calculateOddsFromVotes", () => {
  it("returns equal odds when there are no votes", () => {
    expect(calculateOddsFromVotes([0, 0])).toEqual([2, 2]);
    expect(calculateOddsFromVotes([0, 0, 0])).toEqual([3, 3, 3]);
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

  it("produces a fair book where implied probabilities sum to ~1", () => {
    const odds = calculateOddsFromVotes([5, 3, 1]);
    const impliedSum = odds.reduce((sum, value) => sum + 1 / value, 0);
    expect(impliedSum).toBeCloseTo(1, 2);
  });

  it("returns empty array for empty input", () => {
    expect(calculateOddsFromVotes([])).toEqual([]);
  });
});
