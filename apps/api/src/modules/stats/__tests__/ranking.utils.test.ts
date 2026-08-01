import {
  calculateRankingScore,
  calculateTier,
  calculateWinRate,
} from "../utils/ranking";

jest.mock("../../../config/env", () => ({
  config: {
    RANKING_WIN_WEIGHT: 10,
    RANKING_BALANCE_WEIGHT: 0.1,
    TIER_SILVER_MIN: 50,
    TIER_GOLD_MIN: 200,
  },
}));

describe("ranking utils", () => {
  it("calculates win rate as zero when no bets", () => {
    expect(calculateWinRate(0, 0)).toBe(0);
  });

  it("calculates win rate from won and total bets", () => {
    expect(calculateWinRate(3, 10)).toBe(0.3);
  });

  it("calculates ranking score from wins and balance", () => {
    expect(calculateRankingScore(5, 200)).toBe(70);
  });

  it("assigns tier bands from ranking score", () => {
    expect(calculateTier(10)).toBe("bronze");
    expect(calculateTier(50)).toBe("silver");
    expect(calculateTier(200)).toBe("gold");
  });
});
