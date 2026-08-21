/** Last 4 characters of a ticket UUID (uppercase). */
export function extractTicketShortCode(ticketCode: string): string {
  if (ticketCode.length < 4) {
    return ticketCode.toUpperCase();
  }
  return ticketCode.slice(-4).toUpperCase();
}

/** Digits-only phone for wa.me links (Brazil +55). */
export function toWhatsAppWaMeUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

/** Default ticket WhatsApp contact (matches API STATIC_PIX_COMPROVANTE_PHONE default). */
export const DEFAULT_TICKET_WHATSAPP_PHONE = "(61) 999272342";

export function getTicketWhatsappInstructionMessage(phone: string): string {
  return `Envie este ticket para o seguinte número ${phone}`;
}

export const TICKET_WHATSAPP_INSTRUCTION_PREFIX =
  "Envie este ticket para o seguinte número";
