import { CreateOddSchema, OddEntity } from "./odd.types";
import { z } from "zod";

export enum BetStatus {
  open = "open",
  closed = "closed",
  resolved = "resolved",
}

export interface BetEntity {
  id: number;
  title: string;
  description: string | null;
  status: BetStatus;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  externalMatchId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export type OddsEntity = OddEntity;

export type BetResponse = BetEntity & {
  odds: (OddsEntity & { totalVotes: number })[];
  totalVotes?: number;
};

export type BetQueryParams = {
  status?: BetStatus[];
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
};

export const BetStatusSchema = z.nativeEnum(BetStatus);

export const CreateBetSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().optional(),
  odds: z.array(CreateOddSchema).min(1),
  categoryId: z.number().int().positive(),
});

export const UpdateBetSchema = CreateBetSchema.partial().extend({
  status: BetStatusSchema.optional(),
});

export type CreateBetDTO = z.infer<typeof CreateBetSchema>;
export type UpdateBetDTO = z.infer<typeof UpdateBetSchema>;
