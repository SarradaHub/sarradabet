import QRCode from "qrcode";
import sharp from "sharp";
import { buildTicketSvg } from "../utils/ticketLayout";
import { formatTicketSerial } from "../utils/formatTicketSerial";
import { formatTicketUuid } from "../utils/formatTicketUuid";
import { maskUserIdentity } from "../utils/maskUserIdentity";
import { TicketImageService } from "../services/TicketImageService";

jest.mock("qrcode");
jest.mock("sharp");

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

describe("ticketLayout", () => {
  it("includes redeemed watermark text", () => {
    const svg = buildTicketSvg({
      ticketCode: "abc",
      formattedUuid: "ABCD-EFGH-IJKL-MNOP",
      serial: "SARR-2026-00001",
      rewardTitle: "Camisa",
      userLabel: "p***@sarradabet.com",
      redeemedAtLabel: "23/07/2026 14:30",
      variant: "redeemed",
      qrAvailable: true,
    });

    expect(svg).toContain("APENAS RETIRADA");
    expect(svg).toContain("RESGATADO");
  });

  it("includes validated watermark and stamp", () => {
    const svg = buildTicketSvg({
      ticketCode: "abc",
      formattedUuid: "ABCD-EFGH-IJKL-MNOP",
      serial: "SARR-2026-00001",
      rewardTitle: "Camisa",
      userLabel: "p***@sarradabet.com",
      redeemedAtLabel: "23/07/2026 14:30",
      validatedAtLabel: "24/07/2026 10:00",
      variant: "validated",
      qrAvailable: true,
    });

    expect(svg).toContain("VALIDADO PELA ADMINISTRAÇÃO");
    expect(svg).toContain("VALIDADO");
    expect(svg).not.toContain("APENAS RETIRADA");
  });

  it("renders qr fallback text when qr is unavailable", () => {
    const svg = buildTicketSvg({
      ticketCode: "abc",
      formattedUuid: "ABCD-EFGH-IJKL-MNOP",
      serial: "SARR-2026-00001",
      rewardTitle: "Camisa",
      userLabel: "p***@sarradabet.com",
      redeemedAtLabel: "23/07/2026 14:30",
      variant: "redeemed",
      qrAvailable: false,
    });

    expect(svg).toContain("QR Code indisponível");
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
    (QRCode.toBuffer as jest.Mock).mockResolvedValue(Buffer.from("qr"));
    const pngBuffer = Buffer.from("png");
    const sharpInstance = {
      png: jest.fn().mockReturnThis(),
      resize: jest.fn().mockReturnThis(),
      composite: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(pngBuffer),
    };
    (sharp as unknown as jest.Mock).mockReturnValue(sharpInstance);
  });

  it("generates qr code buffer", async () => {
    const result = await service.generateQrCode(payload.ticketCode);
    expect(result).toEqual(Buffer.from("qr"));
    expect(QRCode.toBuffer).toHaveBeenCalled();
  });

  it("returns null when qr generation fails", async () => {
    (QRCode.toBuffer as jest.Mock).mockRejectedValue(new Error("fail"));
    const result = await service.generateQrCode(payload.ticketCode);
    expect(result).toBeNull();
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
