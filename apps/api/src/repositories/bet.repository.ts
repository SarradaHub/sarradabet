import { PrismaClient } from "@prisma/client";
import { UpdateBetDTO, CreateBetDTO } from "../types/bet.types";

const prisma = new PrismaClient();

export const getAllBetsFromRepository = async (
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
) => {
  const skip = (page - 1) * limit;

  const bets = await prisma.bet.findMany({
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      odds: {
        include: {
          _count: {
            select: { votes: true },
          },
        },
      },
    },
  });

  return bets.map((bet: any) => {
    const totalVotes = bet.odds.reduce(
      (sum: number, odd: any) => sum + odd._count.votes,
      0,
    );
    const odds = bet.odds.map(({ _count, ...rest }: any) => ({
      ...rest,
      totalVotes: _count.votes,
    }));
    return {
      ...bet,
      totalVotes,
      odds,
    };
  });
};

export const createBetWithOdds = async (data: CreateBetDTO) => {
  return prisma.$transaction(async (tx: any) => {
    return tx.bet.create({
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        odds: {
          create: data.odds.map((odd: any) => ({
            title: odd.title,
            value: odd.value,
          })),
        },
      },
      include: { odds: true },
    });
  });
};

export const getBetByIdFromRepository = async (betId: number) => {
  const bet = await prisma.bet.findUnique({
    where: { id: betId },
    include: {
      odds: {
        include: {
          _count: {
            select: { votes: true },
          },
        },
      },
    },
  });

  if (!bet) return null;

  const totalVotes = bet.odds.reduce(
    (sum: number, odd: any) => sum + odd._count.votes,
    0,
  );
  const odds = bet.odds.map(({ _count, ...rest }: any) => ({
    ...rest,
    totalVotes: _count.votes,
  }));

  return {
    ...bet,
    odds,
    totalVotes,
  };
};

export const updateBetFromRepository = async (
  categoryId: number,
  data: UpdateBetDTO,
) => {
  return prisma.category.update({
    where: { id: categoryId },
    data,
  });
};

export const findAllWithVotes = async () => {
  return prisma.bet.findMany({
    include: {
      odds: {
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  });
};

export const findByIdWithVotes = async (betId: number) => {
  return prisma.bet.findUnique({
    where: { id: betId },
    include: {
      odds: {
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  });
};
