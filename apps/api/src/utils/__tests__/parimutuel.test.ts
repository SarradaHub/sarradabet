import {
  calculateOddsFromStakes,
  calculatePayout,
  calculateTakeout,
  estimateReturn,
  netPool,
  targetImpliedProbabilityTotal,
} from "../parimutuel";

describe("parimutuel", () => {
  it("computes net pool with 25% takeout", () => {
    expect(netPool(500)).toBe(375);
    expect(calculateTakeout(500)).toBe(125);
  });

  it("returns zero takeout for empty pool", () => {
    expect(calculateTakeout(0)).toBe(0);
  });

  it("computes winner payout with floor rounding", () => {
    expect(calculatePayout(100, 500, 300)).toBe(125);
  });

  it("estimates return including projected stake", () => {
    expect(estimateReturn(100, 400, 200)).toBe(125);
  });

  it("falls back to laplace odds with takeout when no stakes exist", () => {
    const odds = calculateOddsFromStakes([0, 0]);
    expect(odds).toEqual([1.5, 1.5]);
  });

  it("matches payout to displayed odds for equal two-way pool", () => {
    const odds = calculateOddsFromStakes([500, 500]);
    expect(odds).toEqual([1.5, 1.5]);
    expect(calculatePayout(500, 1000, 500)).toBe(750);
  });

  it("targets implied probability total with takeout", () => {
    expect(targetImpliedProbabilityTotal()).toBeCloseTo(1.333, 3);
  });
});
