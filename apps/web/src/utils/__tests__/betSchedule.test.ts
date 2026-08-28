import { describe, expect, it } from "vitest";
import {
  canAcceptWagers,
  getDisplayBetStatus,
  isBetClosable,
  isBetInResolutionQueue,
  isBetScheduledForFuture,
} from "../betSchedule";

describe("betSchedule", () => {
  const now = new Date("2026-07-26T20:00:00.000Z").getTime();
  const future = "2026-07-27T20:00:00.000Z";
  const past = "2026-07-25T20:00:00.000Z";

  it("blocks scheduled and future-start bets", () => {
    expect(
      canAcceptWagers({ status: "scheduled", startTime: future }, now),
    ).toBe(false);
    expect(
      canAcceptWagers({ status: "open", startTime: future }, now),
    ).toBe(false);
    expect(
      isBetScheduledForFuture({ status: "scheduled", startTime: future }, now),
    ).toBe(true);
  });

  it("allows open bets inside the wagering window", () => {
    expect(
      canAcceptWagers(
        { status: "open", startTime: past, closesAt: future },
        now,
      ),
    ).toBe(true);
  });

  it("shows closed display status when open bet passes closesAt", () => {
    expect(
      getDisplayBetStatus(
        { status: "open", closesAt: past },
        now,
      ),
    ).toBe("closed");
    expect(isBetInResolutionQueue({ status: "open", closesAt: past }, now)).toBe(
      true,
    );
    expect(isBetClosable({ status: "open", closesAt: past }, now)).toBe(false);
  });

  it("marks active open bets as closable but not in resolution queue", () => {
    expect(
      isBetClosable(
        { status: "open", startTime: past, closesAt: future },
        now,
      ),
    ).toBe(true);
    expect(
      isBetInResolutionQueue(
        { status: "open", startTime: past, closesAt: future },
        now,
      ),
    ).toBe(false);
  });
});
