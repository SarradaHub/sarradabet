import {
  calculatePayout,
  estimateReturn,
  estimateTotalReturn,
  netPool,
} from "../parimutuel";

describe("web parimutuel utils", () => {
  it("matches API payout math", () => {
    expect(netPool(500)).toBe(375);
    expect(calculatePayout(100, 500, 300)).toBe(125);
  });

  it("estimates return from board odds shown at selection", () => {
    expect(estimateReturn(100, 1.25)).toBe(125);
    expect(estimateReturn(500, 2.25)).toBe(1125);
  });

  it("never estimates return below stake", () => {
    expect(estimateReturn(500, 1.01)).toBe(505);
  });

  it("sums estimated returns across multiple selections", () => {
    const total = estimateTotalReturn([
      { stake: 150, displayOdd: 2.25 },
      { stake: 600, displayOdd: 2 },
      { stake: 350, displayOdd: 2.25 },
    ]);

    expect(total).toBe(
      estimateReturn(150, 2.25) +
        estimateReturn(600, 2) +
        estimateReturn(350, 2.25),
    );
  });
});
