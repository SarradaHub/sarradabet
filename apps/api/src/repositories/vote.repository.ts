import { Prisma, PrismaClient } from "@prisma/client";
import { CreateVoteDTO } from "../types/vote.types";

const prisma = new PrismaClient();

type VoteWithOdd = Prisma.VoteGetPayload<{ include: { odd: { include: { bet: true } } } }>;

export const createVoteWithOdds = async (data: CreateVoteDTO): Promise<VoteWithOdd> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    return tx.vote.create({
      data: {
        oddId: data.oddId,
      },
      include: {
        odd: {
          include: {
            bet: true,
          },
        },
      },
    });
  });
};
