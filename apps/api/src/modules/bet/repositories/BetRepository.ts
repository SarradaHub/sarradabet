import { PrismaClient } from "@prisma/client";
import type { BetEntity, OddsEntity } from "../../../types/bet.types";
import { BaseRepository } from "../../../core/base/BaseRepository";
import { FindManyParams } from "../../../core/interfaces/IRepository";
import { calculateOddsFromStakes } from "../../../utils/parimutuel";
import { resolveInitialBetStatus } from "../../../utils/betSchedule";
import {
  CreateBetInput,
  UpdateBetInput,
} from "../../../core/validation/ValidationSchemas";

export type BetWithOdds = BetEntity & {
  odds: (OddsEntity & { totalVotes: number; totalStake: number })[];
  totalVotes: number;
  totalStake: number;
  category?: { id: number; title: string };
};

export class BetRepository extends BaseRepository<
  BetWithOdds,
  CreateBetInput,
  UpdateBetInput,
  { id: number }
> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findMany(params?: FindManyParams): Promise<BetWithOdds[]> {
    const { skip, take, orderBy, include, where } = params || {};

    const bets = await this.prisma.bet.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: "desc" },
      include: {
        odds: {
          include: {
            _count: {
              select: { votes: true },
            },
            votes: {
              select: { amount: true },
            },
          },
        },
        category: {
          select: {
            id: true,
            title: true,
          },
        },
        ...include,
      },
    });

    return bets.map((b) => this.transformBetWithVotes(b as never));
  }

  async findUnique(where: { id: number }): Promise<BetWithOdds | null> {
    const bet = await this.prisma.bet.findUnique({
      where,
      include: {
        odds: {
          include: {
            _count: {
              select: { votes: true },
            },
            votes: {
              select: { amount: true },
            },
          },
        },
        category: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return bet ? this.transformBetWithVotes(bet as never) : null;
  }

  async create(data: CreateBetInput): Promise<BetWithOdds> {
    const initialValues = calculateOddsFromStakes(data.odds.map(() => 0));

    const status = resolveInitialBetStatus(data.startTime);

    return this.executeTransaction(async (tx) => {
      const bet = await tx.bet.create({
        data: {
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          status,
          startTime: data.startTime ? new Date(data.startTime) : undefined,
          closesAt: data.closesAt ? new Date(data.closesAt) : undefined,
          odds: {
            create: data.odds.map((odd, index) => ({
              title: odd.title,
              value: initialValues[index],
            })),
          },
        },
        include: {
          odds: {
            include: {
              _count: {
                select: { votes: true },
              },
              votes: {
                select: { amount: true },
              },
            },
          },
          category: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return this.transformBetWithVotes(bet as never);
    });
  }

  async update(
    where: { id: number },
    data: UpdateBetInput,
  ): Promise<BetWithOdds> {
    if (data.odds?.length) {
      return this.executeTransaction(async (tx) => {
        await tx.bet.update({
          where,
          data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && {
              description: data.description,
            }),
            ...(data.categoryId && { categoryId: data.categoryId }),
            ...(data.status && { status: data.status }),
            ...(data.startTime !== undefined && {
              startTime: data.startTime ? new Date(data.startTime) : null,
            }),
            ...(data.closesAt !== undefined && {
              closesAt: data.closesAt ? new Date(data.closesAt) : null,
            }),
          },
        });

        await Promise.all(
          data.odds!.map((odd) =>
            tx.odd.update({
              where: { id: odd.id },
              data: {
                value: odd.value,
                ...(odd.title && { title: odd.title }),
              },
            }),
          ),
        );

        const updatedBet = await tx.bet.findUnique({
          where,
          include: {
            odds: {
              include: {
                _count: {
                  select: { votes: true },
                },
                votes: {
                  select: { amount: true },
                },
              },
            },
            category: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        if (!updatedBet) {
          throw new Error(`Bet with id ${where.id} not found`);
        }

        return this.transformBetWithVotes(updatedBet as never);
      });
    }

    const updatedBet = await this.prisma.bet.update({
      where,
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.status && { status: data.status }),
        ...(data.startTime !== undefined && {
          startTime: data.startTime ? new Date(data.startTime) : null,
        }),
        ...(data.closesAt !== undefined && {
          closesAt: data.closesAt ? new Date(data.closesAt) : null,
        }),
      },
      include: {
        odds: {
          include: {
            _count: {
              select: { votes: true },
            },
            votes: {
              select: { amount: true },
            },
          },
        },
        category: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return this.transformBetWithVotes(updatedBet as never);
  }

  async delete(where: { id: number }): Promise<BetWithOdds> {
    // Capture the bet with its odds BEFORE deletion to return an accurate snapshot
    return this.executeTransaction(async (tx) => {
      const betBeforeDelete = await tx.bet.findUnique({
        where,
        include: {
          odds: {
            include: {
              _count: {
                select: { votes: true },
              },
              votes: {
                select: { amount: true },
              },
            },
          },
          category: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!betBeforeDelete) {
        await tx.bet.delete({ where });
      }

      await tx.odd.deleteMany({ where: { betId: where.id } });
      await tx.bet.delete({ where });

      return this.transformBetWithVotes(betBeforeDelete as never);
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.bet.count({ where });
  }

  async findByStatus(status: string): Promise<BetWithOdds[]> {
    return this.findMany({
      where: { status },
    });
  }

  async findByCategory(categoryId: number): Promise<BetWithOdds[]> {
    return this.findMany({
      where: { categoryId },
    });
  }

  private transformBetWithVotes(
    bet: BetEntity & {
      odds: Array<
        OddsEntity & {
          _count: { votes: number };
          votes?: { amount: number }[];
        }
      >;
      category?: { id: number; title: string };
    },
  ): BetWithOdds {
    const odds = bet.odds.map(
      ({
        _count,
        votes,
        ...odd
      }: OddsEntity & {
        _count: { votes: number };
        votes?: { amount: number }[];
      }) => ({
        ...odd,
        totalVotes: _count.votes,
        totalStake: (votes ?? []).reduce((sum, vote) => sum + vote.amount, 0),
      }),
    );

    const stakeAmounts = odds.map((odd) => odd.totalStake);
    const calculatedValues = calculateOddsFromStakes(stakeAmounts);
    const oddsWithDisplay = odds.map((odd, index) => ({
      ...odd,
      value: calculatedValues[index] ?? odd.value,
    }));

    const totalVotes = oddsWithDisplay.reduce((sum, odd) => sum + odd.totalVotes, 0);
    const totalStake = oddsWithDisplay.reduce((sum, odd) => sum + odd.totalStake, 0);

    return {
      ...bet,
      odds: oddsWithDisplay,
      totalVotes,
      totalStake,
    };
  }
}
