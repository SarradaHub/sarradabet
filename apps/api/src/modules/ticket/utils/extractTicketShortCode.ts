import { logger } from "../../../utils/logger";

export function extractTicketShortCode(ticketCode: string): string {
  if (ticketCode.length < 4) {
    logger.warn("UUID muito curto para extração", { ticketCode });
    return ticketCode.toUpperCase();
  }

  return ticketCode.slice(-4).toUpperCase();
}
