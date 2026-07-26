export type Vote = {
  id: number;
  oddId: number;
  userId: number;
  amount: number;
  status: string;
};

export type CreateVoteDto = {
  oddId: number;
  amount: number;
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
