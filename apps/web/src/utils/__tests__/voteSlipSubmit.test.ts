import { describe, it, expect } from "vitest";
import { formatPartialVoteMessage } from "../voteSlipSubmit";

describe("voteSlipSubmit", () => {
  it("returns null when all votes succeed", () => {
    expect(formatPartialVoteMessage(2, 2)).toBeNull();
  });

  it("returns null when no votes succeeded", () => {
    expect(formatPartialVoteMessage(0, 2)).toBeNull();
  });

  it("returns partial success message", () => {
    expect(formatPartialVoteMessage(1, 3)).toBe(
      "1 de 3 votos registrados. Corrija os demais e tente novamente.",
    );
  });
});
