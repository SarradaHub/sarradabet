export type { CreateVoteDto } from "@sarradabet/types";

export type Vote = {
  id: number;
  oddId: number;
  userId: number;
  amount: number;
  status: string;
};

export type CreateVoteResponse = {
  vote: Vote;
  betId: number;
  odds: {
    id: number;
    totalVotes: number;
    totalStake: number;
    value: number;
  }[];
  totalVotes: number;
  totalStake: number;
};
