import { Factory } from "fishery";
import { faker } from "@faker-js/faker";
import { BetStatus } from "../../types/bet.types";
import { OddResult } from "../../types/odd.types";

export type CategoryAttrs = {
  id?: number;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const categoryFactory = Factory.define<CategoryAttrs>(
  ({ sequence }) => ({
    id: sequence,
    title: faker.commerce.productName(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  }),
);

export type OddAttrs = {
  id?: number;
  title?: string;
  value?: number;
  betId?: number;
  result?: OddResult | null;
};

export const oddFactory = Factory.define<OddAttrs>(({ sequence }) => ({
  id: sequence,
  title: faker.commerce.productAdjective(),
  value: Number(
    faker.number.float({ min: 1.01, max: 10, multipleOf: 0.01 }).toFixed(2),
  ),
  betId: undefined,
  result: null,
}));

export type BetWithOddsAttrs = {
  id?: number;
  title?: string;
  description?: string | null;
  status?: BetStatus;
  categoryId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  odds?: Array<OddAttrs & { totalVotes?: number }>;
  totalVotes?: number;
};

export const betWithOddsFactory = Factory.define<BetWithOddsAttrs>(
  ({ sequence, associations }) => {
    const categoryId =
      associations.categoryId ?? faker.number.int({ min: 1, max: 1000 });
    const odds = oddFactory
      .buildList(2)
      .map((o) => ({ ...o, betId: sequence, totalVotes: 0 }));
    return {
      id: sequence,
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      status: BetStatus.open,
      categoryId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      odds,
      totalVotes: odds.reduce((s, o) => s + (o.totalVotes ?? 0), 0),
    };
  },
);

export const adminFactory = Factory.define<{
  username: string;
  email: string;
  password: string;
}>(() => ({
  username: faker.internet.userName().replace(/\W/g, "_"),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 10 }),
}));
