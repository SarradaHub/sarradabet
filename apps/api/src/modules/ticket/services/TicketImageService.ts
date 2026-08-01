import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import sharp, { type OverlayOptions } from "sharp";
import { config } from "../../../config/env";
import {
  buildTicketSvg,
  type TicketImageVariant,
  TICKET_IMAGE_HEIGHT,
  TICKET_IMAGE_WIDTH,
  TICKET_LOGO_LEFT,
  TICKET_LOGO_SIZE,
  TICKET_LOGO_TOP,
  TICKET_QR_LEFT,
  TICKET_QR_SIZE,
  TICKET_QR_TOP,
} from "../utils/ticketLayout";
import { formatTicketSerial } from "../utils/formatTicketSerial";
import { formatTicketUuid } from "../utils/formatTicketUuid";
import { maskUserIdentity } from "../utils/maskUserIdentity";

function resolveLogoPath(): string {
  const candidates = [
    path.join(__dirname, "..", "assets", "sarradabet_logo.png"),
    path.join(
      process.cwd(),
      "src",
      "modules",
      "ticket",
      "assets",
      "sarradabet_logo.png",
    ),
    path.join(
      process.cwd(),
      "apps",
      "api",
      "src",
      "modules",
      "ticket",
      "assets",
      "sarradabet_logo.png",
    ),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

const LOGO_PATH = resolveLogoPath();

export interface TicketImagePayload {
  redemptionId: number;
  ticketCode: string;
  rewardTitle: string;
  userEmail: string;
  username: string;
  redeemedAt: Date;
  validatedAt?: Date | null;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export class TicketImageService {
  async generateQrCode(ticketCode: string): Promise<Buffer | null> {
    const url = `${config.PUBLIC_WEB_URL}/tickets/verify/${ticketCode}`;

    try {
      return await QRCode.toBuffer(url, {
        errorCorrectionLevel: "H",
        width: TICKET_QR_SIZE,
        margin: 1,
        type: "png",
      });
    } catch {
      return null;
    }
  }

  async generateRedemptionImage(payload: TicketImagePayload): Promise<Buffer> {
    return this.generateImage(payload, "redeemed");
  }

  async generateValidationImage(payload: TicketImagePayload): Promise<Buffer> {
    return this.generateImage(payload, "validated");
  }

  private async generateImage(
    payload: TicketImagePayload,
    variant: TicketImageVariant,
  ): Promise<Buffer> {
    const qrBuffer = await this.generateQrCode(payload.ticketCode);
    const svg = buildTicketSvg({
      ticketCode: payload.ticketCode,
      formattedUuid: formatTicketUuid(payload.ticketCode),
      serial: formatTicketSerial(payload.redemptionId, payload.redeemedAt),
      rewardTitle: payload.rewardTitle,
      userLabel: maskUserIdentity(payload.userEmail, payload.username),
      redeemedAtLabel: formatDateLabel(payload.redeemedAt),
      validatedAtLabel: payload.validatedAt
        ? formatDateLabel(payload.validatedAt)
        : undefined,
      variant,
      qrAvailable: qrBuffer !== null,
    });

    const base = sharp(Buffer.from(svg)).png();
    const composites: OverlayOptions[] = [];

    if (qrBuffer) {
      composites.push({
        input: qrBuffer,
        top: TICKET_QR_TOP,
        left: TICKET_QR_LEFT,
      });
    }

    try {
      composites.unshift({
        input: await sharp(LOGO_PATH)
          .resize(TICKET_LOGO_SIZE, TICKET_LOGO_SIZE)
          .png()
          .toBuffer(),
        top: TICKET_LOGO_TOP,
        left: TICKET_LOGO_LEFT,
      });
    } catch {
      // Logo is optional for generation.
    }

    return base
      .composite(composites)
      .resize(TICKET_IMAGE_WIDTH, TICKET_IMAGE_HEIGHT)
      .png()
      .toBuffer();
  }
}
