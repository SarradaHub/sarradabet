import type { CoinTransaction } from "./coin";
import type { VoteStatus } from "./bet";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedList<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface DashboardStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
}

export interface DashboardRanking {
  score: number;
  position: number | null;
}

export interface RecentBetEntry {
  id: number;
  betId: number;
  betTitle: string;
  oddTitle: string;
  amount: number;
  oddValue: number;
  status: VoteStatus;
  payoutAmount: number | null;
  createdAt: string;
}

export interface DashboardCoinTransaction extends CoinTransaction {
  displayAmount: number;
}

export interface UserDashboardResponse {
  balance: number;
  stats: DashboardStats;
  ranking: DashboardRanking;
  recentBets: PaginatedList<RecentBetEntry>;
  recentTransactions: PaginatedList<DashboardCoinTransaction>;
}

export interface AnalyticsQueryParams {
  startDate: string;
  endDate: string;
  categoryId?: number;
}

export interface AnalyticsOverview {
  activeUsers: number;
  totalBets: number;
  totalCoinVolume: number;
  pixRevenue: number;
  averageBetsPerUser: number;
}

export interface BetsByCategoryRow {
  categoryId: number;
  categoryName: string;
  betCount: number;
  coinVolume: number;
}

export interface PixRevenuePoint {
  day: string;
  revenueCents: number;
  paymentCount: number;
}

export interface PeakHourEntry {
  hour: number;
  betCount: number;
}

export interface AdminDashboardStats {
  totalBets: number;
  totalCategories: number;
  totalVotes: number;
  activeBets: number;
  houseTakeoutBalance: number;
  takeoutPercent: number;
}
