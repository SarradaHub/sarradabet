import type { OddWithVotes } from "@sarradabet/types";

type VoteOddUpdate = {
  id: number;
  totalVotes: number;
  value?: number;
};

export function mergeOddFromVoteUpdate(
  odd: OddWithVotes,
  updated: VoteOddUpdate,
): OddWithVotes {
  return {
    ...odd,
    totalVotes: updated.totalVotes,
    value:
      updated.value != null && Number.isFinite(updated.value)
        ? updated.value
        : odd.value,
  };
}

export function formatOddValue(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value) || value < 1.01) {
    return "—";
  }

  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

const TARGET_IMPLIED_TOTAL = 1;
const MIN_ODD_VALUE = 1.01;
const MAX_ODD_VALUE = 1000;

export function clampOddValue(value: number): number {
  return (
    Math.round(Math.min(MAX_ODD_VALUE, Math.max(MIN_ODD_VALUE, value)) * 100) /
    100
  );
}

export function impliedProbabilityTotal(values: number[]): number {
  return values.reduce(
    (sum, value) => sum + (value >= MIN_ODD_VALUE ? 1 / value : 0),
    0,
  );
}

/**
 * Suggests sibling odd values after one option changes, keeping implied
 * probabilities proportional and targeting sum(1/odd) ≈ 1.
 */
export function estimateSiblingOddValues(
  odds: { value: number }[],
  changedIndex: number,
): Array<number | null> {
  const changedValue = odds[changedIndex]?.value;
  if (changedValue == null || changedValue < MIN_ODD_VALUE) {
    return odds.map(() => null);
  }

  const changedImplied = 1 / changedValue;
  if (changedImplied >= TARGET_IMPLIED_TOTAL) {
    return odds.map(() => null);
  }

  const remainingTarget = TARGET_IMPLIED_TOTAL - changedImplied;
  const otherIndices = odds
    .map((_, index) => index)
    .filter((index) => index !== changedIndex);

  const othersImplied = otherIndices.reduce((sum, index) => {
    const value = odds[index]?.value ?? 0;
    return sum + (value >= MIN_ODD_VALUE ? 1 / value : 0);
  }, 0);

  if (othersImplied <= 0) {
    const equalImplied = remainingTarget / otherIndices.length;
    if (equalImplied <= 0) {
      return odds.map(() => null);
    }

    const equalValue = clampOddValue(1 / equalImplied);
    return odds.map((_, index) => (index === changedIndex ? null : equalValue));
  }

  const scale = remainingTarget / othersImplied;

  return odds.map((odd, index) => {
    if (index === changedIndex || odd.value < MIN_ODD_VALUE) {
      return null;
    }

    const newImplied = (1 / odd.value) * scale;
    if (newImplied <= 0) {
      return null;
    }

    return clampOddValue(1 / newImplied);
  });
}
