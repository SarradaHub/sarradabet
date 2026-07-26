export type RankTier = "bronze" | "silver" | "gold";

export interface UserStats {
  userId: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  rankingScore: number;
  tier: RankTier;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  rankingScore: number;
  winRate: number;
  tier: RankTier;
}
