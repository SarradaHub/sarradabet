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
  /** Last 4 characters of the ticket UUID (uppercase). */
  shortCode?: string;
  /** WhatsApp contact for ticket validation/collection. */
  whatsappPhone?: string;
}
