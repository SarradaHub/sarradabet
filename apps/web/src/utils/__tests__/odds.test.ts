import {
  mergeOddFromVoteUpdate,
  formatOddValue,
  estimateSiblingOddValues,
  impliedProbabilityTotal,
} from "../odds";

describe("mergeOddFromVoteUpdate", () => {
  const odd = {
    id: 1,
    title: "Home",
    value: 2.5,
    totalVotes: 3,
  };

  it("updates value when payload includes it", () => {
    const result = mergeOddFromVoteUpdate(odd, {
      id: 1,
      totalVotes: 4,
      value: 1.8,
    });

    expect(result).toEqual({
      ...odd,
      totalVotes: 4,
      value: 1.8,
    });
  });

  it("preserves existing value when payload omits it", () => {
    const result = mergeOddFromVoteUpdate(odd, {
      id: 1,
      totalVotes: 4,
    });

    expect(result.value).toBe(2.5);
    expect(result.totalVotes).toBe(4);
  });
});

describe("formatOddValue", () => {
  it("formats decimals cleanly", () => {
    expect(formatOddValue(1.666666666666667)).toBe("1.67");
    expect(formatOddValue(2)).toBe("2");
  });

  it("returns dash for invalid values", () => {
    expect(formatOddValue(0)).toBe("—");
    expect(formatOddValue(undefined)).toBe("—");
  });
});

describe("estimateSiblingOddValues", () => {
  it("suggests complementary odd for two-outcome markets", () => {
    const estimates = estimateSiblingOddValues(
      [{ value: 2 }, { value: 2 }],
      0,
    );

    expect(estimates[0]).toBeNull();
    expect(estimates[1]).toBe(2);
  });

  it("keeps proportional balance for three outcomes", () => {
    const estimates = estimateSiblingOddValues(
      [{ value: 1.5 }, { value: 4 }, { value: 4 }],
      0,
    );

    expect(estimates[0]).toBeNull();
    expect(estimates[1]).toBe(6);
    expect(estimates[2]).toBe(6);
  });
});

describe("impliedProbabilityTotal", () => {
  it("sums inverse odds", () => {
    expect(impliedProbabilityTotal([2, 2])).toBeCloseTo(1, 2);
  });
});
