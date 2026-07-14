const MIN_ODD = 1.01;
const MAX_ODD = 1000;

/**
 * Parimutuel decimal odds from vote counts with Laplace smoothing (+1 per outcome).
 * p_i = (votes_i + 1) / (totalVotes + n)
 * odds_i = clamp(1 / p_i, 1.01, 1000)
 */
export function calculateOddsFromVotes(voteCounts: number[]): number[] {
  if (voteCounts.length === 0) {
    return [];
  }

  const n = voteCounts.length;
  const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);
  const denominator = totalVotes + n;

  return voteCounts.map((count) => {
    const probability = (count + 1) / denominator;
    const rawOdd = 1 / probability;
    const clamped = Math.min(MAX_ODD, Math.max(MIN_ODD, rawOdd));
    return Math.round(clamped * 100) / 100;
  });
}

export function validateManualOddsValues(odds: { value: number }[]): void {
  if (odds.some((odd) => odd.value < MIN_ODD || odd.value > MAX_ODD)) {
    throw new Error("Odds values must be between 1.01 and 1000");
  }

  const totalProbability = odds.reduce((sum, odd) => sum + 1 / odd.value, 0);

  if (totalProbability < 0.8 || totalProbability > 1.2) {
    throw new Error("Odds values do not represent realistic probabilities");
  }
}
