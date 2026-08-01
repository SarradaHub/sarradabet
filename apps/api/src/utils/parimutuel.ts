import { config } from "../config/env";

const MIN_ODD = 1.01;
const MAX_ODD = 1000;

export function getTakeoutRate(): number {
  return config.BET_TAKEOUT_RATE;
}

export function netPool(
  totalPool: number,
  takeoutRate: number = getTakeoutRate(),
): number {
  if (totalPool <= 0) {
    return 0;
  }
  return Math.floor(totalPool * (1 - takeoutRate));
}

export function calculateTakeout(
  totalPool: number,
  takeoutRate: number = getTakeoutRate(),
): number {
  if (totalPool <= 0) {
    return 0;
  }
  return totalPool - netPool(totalPool, takeoutRate);
}

export function calculatePayout(
  stake: number,
  totalPool: number,
  winningPool: number,
  takeoutRate: number = getTakeoutRate(),
): number {
  if (stake <= 0 || winningPool <= 0 || totalPool <= 0) {
    return 0;
  }
  const net = netPool(totalPool, takeoutRate);
  return Math.floor((stake * net) / winningPool);
}

function clampOdd(value: number): number {
  const clamped = Math.min(MAX_ODD, Math.max(MIN_ODD, value));
  return Math.round(clamped * 100) / 100;
}

/** Converts gross decimal odds to takeout-adjusted display odds. */
export function applyTakeoutToOdd(
  grossOdd: number,
  takeoutRate: number = getTakeoutRate(),
): number {
  return clampOdd(grossOdd * (1 - takeoutRate));
}

export function targetImpliedProbabilityTotal(
  takeoutRate: number = getTakeoutRate(),
): number {
  return 1 / (1 - takeoutRate);
}

/**
 * Laplace-smoothed decimal odds when no stakes exist yet.
 * Display odds include takeout so payout ≈ stake × odd.
 */
export function calculateOddsFromVoteCounts(
  voteCounts: number[],
  takeoutRate: number = getTakeoutRate(),
): number[] {
  if (voteCounts.length === 0) {
    return [];
  }

  const n = voteCounts.length;
  const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);
  const denominator = totalVotes + n;

  return voteCounts.map((count) => {
    const probability = (count + 1) / denominator;
    return applyTakeoutToOdd(1 / probability, takeoutRate);
  });
}

/**
 * Stake-weighted parimutuel display odds with takeout.
 */
export function calculateOddsFromStakes(
  stakeAmounts: number[],
  takeoutRate: number = getTakeoutRate(),
): number[] {
  if (stakeAmounts.length === 0) {
    return [];
  }

  const totalPool = stakeAmounts.reduce((sum, amount) => sum + amount, 0);
  if (totalPool === 0) {
    return calculateOddsFromVoteCounts(
      stakeAmounts.map(() => 0),
      takeoutRate,
    );
  }

  const net = netPool(totalPool, takeoutRate);
  const n = stakeAmounts.length;

  return stakeAmounts.map((stake) => {
    if (stake <= 0) {
      const grossOdd = totalPool + n;
      return applyTakeoutToOdd(grossOdd, takeoutRate);
    }
    return clampOdd(net / stake);
  });
}

export function estimateReturn(
  stake: number,
  totalPool: number,
  stakeOnOdd: number,
  takeoutRate: number = getTakeoutRate(),
): number {
  if (stake <= 0) {
    return 0;
  }
  return calculatePayout(
    stake,
    totalPool + stake,
    stakeOnOdd + stake,
    takeoutRate,
  );
}

export function validateManualOddsValues(odds: { value: number }[]): void {
  if (odds.some((odd) => odd.value < MIN_ODD || odd.value > MAX_ODD)) {
    throw new Error("Odds values must be between 1.01 and 1000");
  }

  const totalProbability = odds.reduce((sum, odd) => sum + 1 / odd.value, 0);
  const target = targetImpliedProbabilityTotal();

  if (totalProbability < target * 0.8 || totalProbability > target * 1.2) {
    throw new Error("Odds values do not represent realistic probabilities");
  }
}
