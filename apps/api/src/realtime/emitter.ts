import {
  RealtimeEvents,
  type BetListItem,
  type PaymentConfirmedPayload,
  type RealtimeEventName,
  type RealtimePayloadMap,
  type VoteCreatedPayload,
} from "@sarradabet/types";
import { getSocketServer } from "./socket";
import { logger } from "../utils/logger";

function emitEvent<E extends RealtimeEventName>(
  event: E,
  payload: RealtimePayloadMap[E],
): void {
  const io = getSocketServer();
  if (!io) {
    logger.warn(`Socket.io not initialized; skipped emit ${event}`);
    return;
  }
  io.emit(event, payload);
}

function emitToUser<E extends RealtimeEventName>(
  userId: number,
  event: E,
  payload: RealtimePayloadMap[E],
): void {
  const io = getSocketServer();
  if (!io) {
    logger.warn(`Socket.io not initialized; skipped emit ${event}`);
    return;
  }
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitVoteCreated(payload: VoteCreatedPayload): void {
  emitEvent(RealtimeEvents.VOTE_CREATED, payload);
}

export function emitBetCreated(payload: BetListItem): void {
  emitEvent(RealtimeEvents.BET_CREATED, payload);
}

export function emitBetUpdated(payload: BetListItem): void {
  emitEvent(RealtimeEvents.BET_UPDATED, payload);
}

export function emitPaymentConfirmed(
  userId: number,
  payload: PaymentConfirmedPayload,
): void {
  emitToUser(userId, RealtimeEvents.PAYMENT_CONFIRMED, payload);
}
