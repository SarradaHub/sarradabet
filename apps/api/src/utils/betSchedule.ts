import type { BetStatus } from "@prisma/client";

type ScheduleFields = {
  status: BetStatus | string;
  startTime?: Date | null;
  closesAt?: Date | null;
};

export function resolveInitialBetStatus(
  startTime?: Date | string | null,
  now = new Date(),
): BetStatus {
  if (startTime && new Date(startTime) > now) {
    return "scheduled";
  }

  return "open";
}

export function isBetAcceptingWagers(
  bet: ScheduleFields,
  now = new Date(),
): boolean {
  if (bet.status !== "open") {
    return false;
  }

  if (bet.startTime && bet.startTime > now) {
    return false;
  }

  if (bet.closesAt && bet.closesAt <= now) {
    return false;
  }

  return true;
}

export function wagerRejectionMessage(bet: ScheduleFields, now = new Date()): string {
  if (bet.status === "scheduled") {
    return "Aposta ainda não está aberta para votos";
  }

  if (bet.status !== "open") {
    return "Aposta está fechada";
  }

  if (bet.startTime && bet.startTime > now) {
    return "Aposta ainda não está aberta para votos";
  }

  if (bet.closesAt && bet.closesAt <= now) {
    return "Aposta está fechada";
  }

  return "Aposta está fechada";
}

export function resolveStatusAfterScheduleChange(
  currentStatus: BetStatus,
  startTime: Date | null | undefined,
  now = new Date(),
): BetStatus | undefined {
  if (currentStatus === "closed" || currentStatus === "resolved") {
    return undefined;
  }

  if (startTime && startTime > now) {
    return "scheduled";
  }

  if (currentStatus === "scheduled") {
    return "open";
  }

  return undefined;
}
