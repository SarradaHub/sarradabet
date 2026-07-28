function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export type TicketImageVariant = "redeemed" | "validated";

export interface TicketLayoutInput {
  ticketCode: string;
  formattedUuid: string;
  serial: string;
  rewardTitle: string;
  userLabel: string;
  redeemedAtLabel: string;
  validatedAtLabel?: string;
  variant: TicketImageVariant;
  qrAvailable: boolean;
}

/** Mobile-first portrait canvas (9:15 ratio, optimized for phone screens). */
export const TICKET_IMAGE_WIDTH = 480;
export const TICKET_IMAGE_HEIGHT = 800;

export const TICKET_QR_SIZE = 220;
export const TICKET_QR_TOP = 128;
export const TICKET_QR_LEFT =
  Math.floor((TICKET_IMAGE_WIDTH - TICKET_QR_SIZE) / 2);

export const TICKET_LOGO_SIZE = 36;
export const TICKET_LOGO_TOP = 16;
export const TICKET_LOGO_LEFT = 20;

const PADDING = 24;
const CONTENT_X = PADDING;
const CONTENT_WIDTH = TICKET_IMAGE_WIDTH - PADDING * 2;

export function buildTicketSvg(input: TicketLayoutInput): string {
  const isValidated = input.variant === "validated";
  const statusLabel = isValidated ? "VALIDADO" : "RESGATADO";
  const statusColor = isValidated ? "#22c55e" : "#facc15";
  const watermarkText = isValidated
    ? "VALIDADO PELA ADMINISTRAÇÃO"
    : "APENAS RETIRADA";
  const watermarkColor = isValidated ? "#22c55e" : "#64748b";
  const watermarkOpacity = isValidated ? 0.22 : 0.18;

  const qrCenterX = TICKET_IMAGE_WIDTH / 2;
  const qrPlaceholder = input.qrAvailable
    ? ""
    : `
      <rect x="${TICKET_QR_LEFT}" y="${TICKET_QR_TOP}" width="${TICKET_QR_SIZE}" height="${TICKET_QR_SIZE}" rx="16" fill="#111827" stroke="#334155"/>
      <text x="${qrCenterX}" y="${TICKET_QR_TOP + 98}" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="Arial, sans-serif">
        QR Code indisponível
      </text>
      <text x="${qrCenterX}" y="${TICKET_QR_TOP + 118}" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="Arial, sans-serif">
        use o código abaixo
      </text>
    `;

  const validatedStamp = isValidated
    ? `
      <g transform="translate(${TICKET_IMAGE_WIDTH - 132}, 52) rotate(-10)">
        <rect x="0" y="0" width="108" height="34" rx="8" fill="#14532d" stroke="#22c55e" stroke-width="2"/>
        <text x="54" y="23" text-anchor="middle" fill="#bbf7d0" font-size="13" font-weight="700" font-family="Arial, sans-serif">
          VALIDADO
        </text>
      </g>
    `
    : "";

  const validatedLine = input.validatedAtLabel
    ? `<text x="${CONTENT_X}" y="536" fill="#cbd5e1" font-size="14" font-family="Arial, sans-serif">Validado: ${escapeXml(input.validatedAtLabel)}</text>`
    : "";

  const detailsStartY = TICKET_QR_TOP + TICKET_QR_SIZE + 36;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${TICKET_IMAGE_WIDTH}" height="${TICKET_IMAGE_HEIGHT}" viewBox="0 0 ${TICKET_IMAGE_WIDTH} ${TICKET_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
  </defs>

  <rect width="${TICKET_IMAGE_WIDTH}" height="${TICKET_IMAGE_HEIGHT}" rx="20" fill="#0f172a"/>

  <g opacity="${watermarkOpacity}">
    <text x="${qrCenterX}" y="420" text-anchor="middle" fill="${watermarkColor}" font-size="28" font-weight="700"
      font-family="Arial, sans-serif" transform="rotate(-45 ${qrCenterX} 420)">
      ${escapeXml(watermarkText)}
    </text>
  </g>

  <rect x="0" y="0" width="${TICKET_IMAGE_WIDTH}" height="72" fill="#111827"/>
  <text x="68" y="32" fill="url(#brandGradient)" font-size="20" font-weight="700" font-family="Arial, sans-serif">
    SarradaBet
  </text>
  <text x="68" y="52" fill="#94a3b8" font-size="11" font-family="Arial, sans-serif">
    Ticket # ${escapeXml(input.formattedUuid)}
  </text>

  ${validatedStamp}

  <rect x="${CONTENT_X}" y="88" width="${CONTENT_WIDTH}" height="30" rx="10" fill="${statusColor}" opacity="0.15"/>
  <text x="${qrCenterX}" y="108" text-anchor="middle" fill="${statusColor}" font-size="13" font-weight="700" font-family="Arial, sans-serif">
    ${statusLabel}
  </text>

  ${qrPlaceholder}

  <text x="${CONTENT_X}" y="${detailsStartY}" fill="#f8fafc" font-size="20" font-weight="700" font-family="Arial, sans-serif">
    ${escapeXml(truncate(input.rewardTitle, 34))}
  </text>
  <text x="${CONTENT_X}" y="${detailsStartY + 32}" fill="#cbd5e1" font-size="14" font-family="Arial, sans-serif">
    Usuário: ${escapeXml(truncate(input.userLabel, 32))}
  </text>
  <text x="${CONTENT_X}" y="${detailsStartY + 58}" fill="#cbd5e1" font-size="14" font-family="Arial, sans-serif">
    Resgatado: ${escapeXml(input.redeemedAtLabel)}
  </text>
  ${validatedLine}

  <rect x="${CONTENT_X}" y="564" width="${CONTENT_WIDTH}" height="72" rx="12" fill="#111827" stroke="#334155"/>
  <text x="${CONTENT_X + 12}" y="588" fill="#94a3b8" font-size="10" font-family="Arial, sans-serif">
    CÓDIGO DO TICKET
  </text>
  <text x="${CONTENT_X + 12}" y="616" fill="#e2e8f0" font-size="11" font-family="monospace">
    ${escapeXml(truncate(input.ticketCode, 38))}
  </text>

  <rect x="0" y="${TICKET_IMAGE_HEIGHT - 56}" width="${TICKET_IMAGE_WIDTH}" height="56" fill="#111827"/>
  <text x="${CONTENT_X}" y="${TICKET_IMAGE_HEIGHT - 24}" fill="#94a3b8" font-size="11" font-family="Arial, sans-serif">
    Válido apenas na SarradaBet
  </text>
  <text x="${CONTENT_X}" y="${TICKET_IMAGE_HEIGHT - 8}" fill="#64748b" font-size="10" font-family="Arial, sans-serif">
    Serial: ${escapeXml(input.serial)}
  </text>
</svg>`;
}
