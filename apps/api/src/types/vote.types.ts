import { z } from "zod";

export interface VoteEntity {
  id: number;
  oddId: number;
  userId: number;
  amount: number;
  status: "pending" | "paid" | "lost";
  payoutAmount?: number | null;
  paidAt?: Date | null;
  createdAt: Date;
}

export type VoteResponse = VoteEntity & {
  odd?: number;
};

export type VoteQueryParams = {
  oddId?: number;
  page?: number;
  limit?: number;
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
};

export const CreateVoteSchema = z.object({
  oddId: z.number().int().positive(),
  amount: z
    .number()
    .int()
    .positive("Stake amount must be at least 1 coin"),
});

export type CreateVoteDTO = z.infer<typeof CreateVoteSchema>;
