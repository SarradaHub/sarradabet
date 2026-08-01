export type TicketStatus = "REDEEMED" | "VALIDATED" | "NOT_FOUND";

export interface TicketVerifyResponse {
  ticketCode: string;
  isValid: boolean;
  status: TicketStatus;
  message?: string;
  rewardTitle?: string;
  userEmail?: string;
  redeemedAt?: string;
  validatedAt?: string | null;
}
