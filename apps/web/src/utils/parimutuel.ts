const DEFAULT_TAKEOUT_RATE = 0.25;
const MIN_DISPLAY_ODD = 1.01;

export function netPool(
  totalPool: number,
  takeoutRate: number = DEFAULT_TAKEOUT_RATE,
): number {
  if (totalPool <= 0) {
    return 0;
  }
  return Math.floor(totalPool * (1 - takeoutRate));
}

export function calculatePayout(
  stake: number,
  totalPool: number,
  winningPool: number,
  takeoutRate: number = DEFAULT_TAKEOUT_RATE,
): number {
  if (stake <= 0 || winningPool <= 0 || totalPool <= 0) {
    return 0;
  }
  const net = netPool(totalPool, takeoutRate);
  return Math.floor((stake * net) / winningPool);
}

/** Frontend-only estimate using the odd shown on the board at selection time. */
export function estimateReturn(stake: number, displayOdd: number): number {
  if (stake <= 0 || displayOdd < MIN_DISPLAY_ODD) {
    return 0;
  }

  return Math.max(stake, Math.floor(stake * displayOdd));
}

export interface ReturnEstimateLine {
  stake: number;
  displayOdd: number;
}

export function estimateTotalReturn(lines: ReturnEstimateLine[]): number {
  return lines.reduce(
    (sum, line) => sum + estimateReturn(line.stake, line.displayOdd),
    0,
  );
}
