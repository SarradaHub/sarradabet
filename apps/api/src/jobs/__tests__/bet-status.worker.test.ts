import { calculatePayout, netPool } from "../../utils/parimutuel";

describe("bet-status worker expectations", () => {
  it("documents parimutuel payout used by payout worker", () => {
    const totalPool = 500;
    const winningPool = 300;
    const stake = 100;

    expect(netPool(totalPool)).toBe(375);
    expect(calculatePayout(stake, totalPool, winningPool)).toBe(125);
  });
});
