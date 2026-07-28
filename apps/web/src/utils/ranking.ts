import type { RankTier } from "@sarradabet/types";

const TIER_SILVER_MIN = 50;
const TIER_GOLD_MIN = 200;

export function calculateTier(rankingScore: number): RankTier {
  if (rankingScore >= TIER_GOLD_MIN) {
    return "gold";
  }
  if (rankingScore >= TIER_SILVER_MIN) {
    return "silver";
  }
  return "bronze";
}
