import { config } from "../../../config/env";

export function getTicketWhatsappPhone(): string {
  return config.STATIC_PIX_COMPROVANTE_PHONE;
}

export function getTicketWhatsappInstructionPrefix(): string {
  return "Envie este ticket para o seguinte número";
}

export function getTicketWhatsappInstructionMessage(): string {
  return `${getTicketWhatsappInstructionPrefix()} ${getTicketWhatsappPhone()}`;
}

/** Digits-only phone for wa.me links (Brazil +55). */
export function getTicketWhatsappWaMeDigits(): string {
  const digits = getTicketWhatsappPhone().replace(/\D/g, "");
  if (digits.startsWith("55")) {
    return digits;
  }
  return `55${digits}`;
}
