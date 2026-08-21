import { describe, expect, it } from "vitest";
import {
  DEFAULT_TICKET_WHATSAPP_PHONE,
  extractTicketShortCode,
  getTicketWhatsappInstructionMessage,
  toWhatsAppWaMeUrl,
} from "../ticketContact";

describe("ticketContact", () => {
  it("extracts last 4 characters uppercase", () => {
    expect(extractTicketShortCode("abc-123-def-456-7890")).toBe("7890");
  });

  it("builds whatsapp instruction message", () => {
    expect(getTicketWhatsappInstructionMessage(DEFAULT_TICKET_WHATSAPP_PHONE)).toBe(
      "Envie este ticket para o seguinte número (61) 999272342",
    );
  });

  it("builds wa.me url with Brazil country code", () => {
    expect(toWhatsAppWaMeUrl("(61) 999272342")).toBe(
      "https://wa.me/5561999272342",
    );
  });
});
