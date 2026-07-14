export type Vote = {
  id: number;
  oddId: number;
};

export type CreateVoteDto = {
  oddId: number;
};

export type CreateVoteResponse = {
  vote: Vote;
  betId: number;
  odds: { id: number; totalVotes: number; value: number }[];
  totalVotes: number;
};
