export type { CreateVoteDto } from "@sarradabet/types";

export type Vote = {
  id: number;
  oddId: number;
  userId: number;
  amount: number;
};

export type CreateVoteResponse = {
  vote: Vote;
  betId: number;
  oddId: number;
  odds: { id: number; totalVotes: number; totalStake: number; value: number }[];
  totalVotes: number;
  totalStake: number;
};
