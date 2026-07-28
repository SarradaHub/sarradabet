export type BetStatus = "scheduled" | "open" | "closed" | "resolved";
export type OddResult = "pending" | "won" | "lost";
export type VoteStatus = "pending" | "paid" | "lost";

export type OddWithVotes = {
  id: number;
  title: string;
  value: number;
  totalVotes: number;
  totalStake: number;
};

export type OddDetail = OddWithVotes & {
  result?: OddResult;
  betId?: number;
};

export type CategoryRef = {
  id: number;
  title: string;
};

export type BetListItem = {
  id: number;
  title: string;
  description?: string | null;
  status: BetStatus;
  categoryId: number;
  category?: CategoryRef;
  odds: OddWithVotes[];
  totalVotes: number;
  totalStake: number;
  startTime?: string | Date | null;
  closesAt?: string | Date | null;
  createdAt: string | Date;
};

export type BetDetail = BetListItem & {
  updatedAt: string | Date;
  resolvedAt?: string | Date | null;
  odds: OddDetail[];
};

export type CreateBetDto = {
  title: string;
  description?: string;
  categoryId: number;
  startTime?: string;
  closesAt?: string;
  odds: Array<{
    title: string;
  }>;
};

export type UpdateBetDto = {
  title?: string;
  description?: string;
  categoryId?: number;
  status?: BetStatus;
  startTime?: string | null;
  closesAt?: string | null;
  odds?: Array<{
    id: number;
    title?: string;
    value: number;
  }>;
};

export type CreateVoteDto = {
  oddId: number;
  amount: number;
};

export type ResolveBetDto = {
  winningOddId: number;
};
