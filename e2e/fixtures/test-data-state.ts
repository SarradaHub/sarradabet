type TestCategory = {
  id: number;
  title: string;
};

type TestBet = {
  id: number;
  title: string;
  odds: Array<{ id: number; title: string }>;
  winningOddId?: number;
};

let testCategory: TestCategory | null = null;
let testBet: TestBet | null = null;
let closedBet: TestBet | null = null;
let resolvedBet: TestBet | null = null;
let payoutBet: (TestBet & { winningOddId: number }) | null = null;
let scheduledJobBet: TestBet | null = null;
let expiredOpenJobBet: TestBet | null = null;

export function setTestCategory(category: TestCategory): void {
  testCategory = category;
}

export function getTestCategory(): TestCategory | null {
  return testCategory;
}

export function clearTestCategory(): void {
  testCategory = null;
}

export function setTestBet(bet: TestBet): void {
  testBet = bet;
}

export function getTestBet(): TestBet | null {
  return testBet;
}

export function clearTestBet(): void {
  testBet = null;
}

export function setClosedBet(bet: TestBet): void {
  closedBet = bet;
}

export function getClosedBet(): TestBet | null {
  return closedBet;
}

export function clearClosedBet(): void {
  closedBet = null;
}

export function setResolvedBet(bet: TestBet): void {
  resolvedBet = bet;
}

export function getResolvedBet(): TestBet | null {
  return resolvedBet;
}

export function clearResolvedBet(): void {
  resolvedBet = null;
}

export function setPayoutBet(
  bet: TestBet & { winningOddId: number },
): void {
  payoutBet = bet;
}

export function getPayoutBet(): (TestBet & { winningOddId: number }) | null {
  return payoutBet;
}

export function clearPayoutBet(): void {
  payoutBet = null;
}

export function setScheduledJobBet(bet: TestBet): void {
  scheduledJobBet = bet;
}

export function getScheduledJobBet(): TestBet | null {
  return scheduledJobBet;
}

export function setExpiredOpenJobBet(bet: TestBet): void {
  expiredOpenJobBet = bet;
}

export function getExpiredOpenJobBet(): TestBet | null {
  return expiredOpenJobBet;
}
