import { readFileSync } from "fs";
import path from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import { betMarketCreatedPayload, wagerAcceptedPayload } from "../EventFactory";
import { BetStatus } from "@/types/bet.types";

const rootPath = path.resolve(__dirname, "../../../../../../../");

const loadSchema = (relativePath: string) => {
  const fullPath = path.resolve(rootPath, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf-8"));
};

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

describe("EventFactory contract tests", () => {
  it("creates a valid bet.market.created payload", () => {
    const bet = {
      id: 42,
      title: "Team A vs Team B",
      description: "Auto-generated market",
      status: BetStatus.open,
      categoryId: 1,
      createdAt: new Date("2025-11-12T10:00:00Z"),
      updatedAt: new Date("2025-11-12T10:00:00Z"),
      resolvedAt: null,
      externalMatchId: "match-uuid",
      metadata: null,
      odds: [
        { id: 1, title: "Team A", value: 1.8, totalVotes: 0 },
        { id: 2, title: "Team B", value: 2.0, totalVotes: 0 },
      ],
    } as const;

    const payload = betMarketCreatedPayload(bet as any);

    const schema = loadSchema("platform/contracts/schemas/betting/bet.market.created.v1.json");
    const validate = ajv.compile(schema);
    const valid = validate(payload);

    if (!valid) {
      console.error(validate.errors);
    }

    expect(valid).toBe(true);
  });

  it("creates a valid wager.accepted payload", () => {
    const payload = wagerAcceptedPayload({
      wagerId: "1",
      betId: "42",
      oddId: "2",
      stake: 10,
      potentialPayout: 18,
      userId: "00000000-0000-0000-0000-000000000123",
    });

    const schema = loadSchema("platform/contracts/schemas/betting/wager.accepted.v1.json");
    const validate = ajv.compile(schema);
    const valid = validate(payload);

    if (!valid) {
      console.error(validate.errors);
    }

    expect(valid).toBe(true);
  });
});
