export type BetStatus = "open" | "closed" | "resolved";
export type OddResult = "pending" | "won" | "lost";

export type OddWithVotes = {
  id: number;
  title: string;
  value: number;
  totalVotes: number;
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
  odds: Array<{
    title: string;
    value: number;
  }>;
};

export type UpdateBetDto = Partial<CreateBetDto> & {
  status?: BetStatus;
};
