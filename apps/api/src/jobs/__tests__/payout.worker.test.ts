import { calculatePayout, netPool } from "../../utils/parimutuel";

describe("payout worker math", () => {
  it("does not double pay when recalculated", () => {
    const first = calculatePayout(100, 500, 300);
    const second = calculatePayout(100, 500, 300);
    expect(first).toBe(second);
    expect(first).toBe(125);
  });

  it("returns zero payout for losers", () => {
    expect(calculatePayout(100, 500, 0)).toBe(0);
  });

  it("uses parimutuel pool with 25% takeout", () => {
    expect(netPool(400)).toBe(300);
    expect(calculatePayout(100, 400, 200)).toBe(150);
  });

  it("floors fractional payouts to whole coins", () => {
    expect(calculatePayout(10, 33, 11)).toBe(
      Math.floor((10 * netPool(33)) / 11),
    );
  });
});
