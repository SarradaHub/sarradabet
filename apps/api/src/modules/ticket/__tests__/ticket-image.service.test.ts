import sharp from "sharp";
import { logger } from "../../../utils/logger";
import { buildTicketSvg } from "../utils/ticketLayout";
import { extractTicketShortCode } from "../utils/extractTicketShortCode";
import { formatTicketSerial } from "../utils/formatTicketSerial";
import { formatTicketUuid } from "../utils/formatTicketUuid";
import { maskUserIdentity } from "../utils/maskUserIdentity";
import {
  getTicketWhatsappInstructionMessage,
  getTicketWhatsappPhone,
} from "../utils/ticketContact";
import { TicketImageService } from "../services/TicketImageService";

jest.mock("sharp");
jest.mock("../../../utils/logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("ticket utils", () => {
  it("masks email identities", () => {
    expect(maskUserIdentity("pedro@sarradabet.com", "pedro")).toBe(
      "p***@sarradabet.com",
    );
  });

  it("formats ticket uuid groups", () => {
    expect(
      formatTicketUuid("550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("550E-8400-E29B-41D4");
  });

  it("formats ticket serial", () => {
    expect(formatTicketSerial(42, new Date("2026-07-23T14:30:00Z"))).toBe(
      "SARR-2026-00042",
    );
  });
});

describe("extractTicketShortCode", () => {
  it("returns last 4 characters uppercase", () => {
    expect(extractTicketShortCode("abc-123-def-456-7890")).toBe("7890");
    expect(extractTicketShortCode("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "0000",
    );
  });

  it("uppercases mixed-case suffix", () => {
    expect(extractTicketShortCode("abc-123-def-456-ab12")).toBe("AB12");
  });

  it("returns full code and logs when shorter than 4 characters", () => {
    expect(extractTicketShortCode("abc")).toBe("ABC");
    expect(logger.warn).toHaveBeenCalledWith(
      "UUID muito curto para extração",
      { ticketCode: "abc" },
    );
  });
});

describe("ticketContact", () => {
  it("builds instruction message from configured phone", () => {
    expect(getTicketWhatsappInstructionMessage()).toBe(
      `Envie este ticket para o seguinte número ${getTicketWhatsappPhone()}`,
    );
  });
});

describe("ticketLayout", () => {
  const baseInput = {
    ticketCode: "abc-123-def-456-7890",
    formattedUuid: "ABCD-EFGH-IJKL-MNOP",
    serial: "SARR-2026-00001",
    rewardTitle: "Camisa",
    userLabel: "p***@sarradabet.com",
    redeemedAtLabel: "23/07/2026 14:30",
    shortCode: "7890",
    whatsappPhone: "(61) 999272342",
  };

  it("includes redeemed watermark text and last-4 block", () => {
    const svg = buildTicketSvg({
      ...baseInput,
      variant: "redeemed",
    });

    expect(svg).toContain("APENAS RETIRADA");
    expect(svg).toContain("RESGATADO");
    expect(svg).toContain("Código do Ticket:");
    expect(svg).toContain("7890");
    expect(svg).toContain("Envie este ticket para o seguinte número:");
    expect(svg).toContain("(61) 999272342");
    expect(svg).toContain("#FFD700");
    expect(svg).toContain("UUID: abc-123-def-456-7890");
    expect(svg).not.toContain("QR Code");
  });

  it("includes validated watermark and stamp", () => {
    const svg = buildTicketSvg({
      ...baseInput,
      validatedAtLabel: "24/07/2026 10:00",
      variant: "validated",
    });

    expect(svg).toContain("VALIDADO PELA ADMINISTRAÇÃO");
    expect(svg).toContain("VALIDADO");
    expect(svg).not.toContain("APENAS RETIRADA");
  });

  it("does not render qr placeholder", () => {
    const svg = buildTicketSvg({
      ...baseInput,
      variant: "redeemed",
    });

    expect(svg).not.toContain("QR Code indisponível");
  });
});

describe("TicketImageService", () => {
  const service = new TicketImageService();
  const payload = {
    redemptionId: 1,
    ticketCode: "550e8400-e29b-41d4-a716-446655440000",
    rewardTitle: "Camisa Oficial",
    userEmail: "pedro@sarradabet.com",
    username: "pedro",
    redeemedAt: new Date("2026-07-23T14:30:00Z"),
    validatedAt: new Date("2026-07-24T10:00:00Z"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const pngBuffer = Buffer.from("png");
    const sharpInstance = {
      png: jest.fn().mockReturnThis(),
      resize: jest.fn().mockReturnThis(),
      composite: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(pngBuffer),
    };
    (sharp as unknown as jest.Mock).mockReturnValue(sharpInstance);
  });

  it("generates redemption png without throwing", async () => {
    const result = await service.generateRedemptionImage(payload);
    expect(result).toEqual(Buffer.from("png"));
  });

  it("generates validation png without throwing", async () => {
    const result = await service.generateValidationImage(payload);
    expect(result).toEqual(Buffer.from("png"));
  });
});
