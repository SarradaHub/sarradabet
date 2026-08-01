import type { BetStatus } from "@sarradabet/types";

type BetSchedule = {
  status: BetStatus;
  startTime?: string | Date | null;
  closesAt?: string | Date | null;
};

function toTimestamp(value: string | Date | null | undefined): number | null {
  if (value == null || value === "") {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function canAcceptWagers(
  bet: BetSchedule,
  now = Date.now(),
): boolean {
  if (bet.status !== "open") {
    return false;
  }

  const start = toTimestamp(bet.startTime);
  if (start != null && start > now) {
    return false;
  }

  const closes = toTimestamp(bet.closesAt);
  if (closes != null && closes <= now) {
    return false;
  }

  return true;
}

export function isBetScheduledForFuture(
  bet: BetSchedule,
  now = Date.now(),
): boolean {
  if (bet.status === "scheduled") {
    return true;
  }

  const start = toTimestamp(bet.startTime);
  return start != null && start > now;
}
