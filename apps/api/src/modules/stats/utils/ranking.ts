import type { RankTier } from "@sarradabet/types";
import { config } from "../../../config/env";

export function calculateWinRate(wonBets: number, totalBets: number): number {
  return totalBets > 0 ? wonBets / totalBets : 0;
}

export function calculateRankingScore(
  wonBets: number,
  coinBalance: number,
): number {
  return (
    wonBets * config.RANKING_WIN_WEIGHT +
    coinBalance * config.RANKING_BALANCE_WEIGHT
  );
}

export function calculateTier(rankingScore: number): RankTier {
  if (rankingScore >= config.TIER_GOLD_MIN) {
    return "gold";
  }
  if (rankingScore >= config.TIER_SILVER_MIN) {
    return "silver";
  }
  return "bronze";
}

export const LEADERBOARD_CACHE_KEY = "leaderboard:top100";
