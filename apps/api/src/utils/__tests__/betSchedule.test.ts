import {
  isBetAcceptingWagers,
  resolveInitialBetStatus,
  resolveStatusAfterScheduleChange,
  wagerRejectionMessage,
} from "../betSchedule";

describe("betSchedule", () => {
  const now = new Date("2026-07-26T20:00:00.000Z");
  const future = new Date("2026-07-27T20:00:00.000Z");
  const past = new Date("2026-07-25T20:00:00.000Z");

  it("marks future start times as scheduled on create", () => {
    expect(resolveInitialBetStatus(future, now)).toBe("scheduled");
    expect(resolveInitialBetStatus(past, now)).toBe("open");
    expect(resolveInitialBetStatus(null, now)).toBe("open");
  });

  it("rejects wagers on scheduled bets", () => {
    expect(
      isBetAcceptingWagers(
        { status: "scheduled", startTime: future },
        now,
      ),
    ).toBe(false);

    expect(
      wagerRejectionMessage({ status: "scheduled", startTime: future }, now),
    ).toBe("Aposta ainda não está aberta para votos");
  });

  it("rejects wagers when open bet still has future start time", () => {
    expect(
      isBetAcceptingWagers({ status: "open", startTime: future }, now),
    ).toBe(false);
  });

  it("accepts wagers on open bets within the window", () => {
    expect(
      isBetAcceptingWagers(
        { status: "open", startTime: past, closesAt: future },
        now,
      ),
    ).toBe(true);
  });

  it("syncs status when schedule changes", () => {
    expect(
      resolveStatusAfterScheduleChange("open", future, now),
    ).toBe("scheduled");
    expect(
      resolveStatusAfterScheduleChange("scheduled", past, now),
    ).toBe("open");
    expect(
      resolveStatusAfterScheduleChange("closed", future, now),
    ).toBeUndefined();
  });
});
