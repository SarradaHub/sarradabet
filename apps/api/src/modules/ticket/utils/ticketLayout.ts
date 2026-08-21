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
  shortCode: string;
  whatsappPhone: string;
}

/** Mobile-first portrait canvas (9:15 ratio, optimized for phone screens). */
export const TICKET_IMAGE_WIDTH = 480;
export const TICKET_IMAGE_HEIGHT = 800;

export const TICKET_CODE_BLOCK_TOP = 136;
export const TICKET_CODE_CENTER_X = TICKET_IMAGE_WIDTH / 2;

export const TICKET_LOGO_SIZE = 36;
export const TICKET_LOGO_TOP = 10;
export const TICKET_LOGO_LEFT = Math.floor(
  (TICKET_IMAGE_WIDTH - TICKET_LOGO_SIZE) / 2,
);

const PADDING = 24;
const CONTENT_WIDTH = TICKET_IMAGE_WIDTH - PADDING * 2;

const WHATSAPP_GOLD = "#FFD700";

export function buildTicketSvg(input: TicketLayoutInput): string {
  const isValidated = input.variant === "validated";
  const statusLabel = isValidated ? "VALIDADO" : "RESGATADO";
  const statusColor = isValidated ? "#22c55e" : "#facc15";
  const watermarkText = isValidated
    ? "VALIDADO PELA ADMINISTRAÇÃO"
    : "APENAS RETIRADA";
  const watermarkColor = isValidated ? "#22c55e" : "#64748b";
  const watermarkOpacity = isValidated ? 0.22 : 0.18;

  const validatedStamp = isValidated
    ? `
      <g transform="translate(${Math.floor((TICKET_IMAGE_WIDTH - 108) / 2)}, 78) rotate(-10)">
        <rect x="0" y="0" width="108" height="34" rx="8" fill="#14532d" stroke="#22c55e" stroke-width="2"/>
        <text x="54" y="23" text-anchor="middle" fill="#bbf7d0" font-size="13" font-weight="700" font-family="Arial, sans-serif">
          VALIDADO
        </text>
      </g>
    `
    : "";

  const codeLabelY = TICKET_CODE_BLOCK_TOP;
  const shortCodeY = TICKET_CODE_BLOCK_TOP + 72;
  const contactPrefixY = TICKET_CODE_BLOCK_TOP + 118;
  const phoneY = TICKET_CODE_BLOCK_TOP + 152;

  const detailsStartY = TICKET_CODE_BLOCK_TOP + 196;

  const validatedLine = input.validatedAtLabel
    ? `<text x="${TICKET_CODE_CENTER_X}" y="${detailsStartY + 90}" text-anchor="middle" fill="#cbd5e1" font-size="14" font-family="Arial, sans-serif">Validado: ${escapeXml(input.validatedAtLabel)}</text>`
    : "";

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
    <text x="${TICKET_CODE_CENTER_X}" y="420" text-anchor="middle" fill="${watermarkColor}" font-size="28" font-weight="700"
      font-family="Arial, sans-serif" transform="rotate(-45 ${TICKET_CODE_CENTER_X} 420)">
      ${escapeXml(watermarkText)}
    </text>
  </g>

  <rect x="0" y="0" width="${TICKET_IMAGE_WIDTH}" height="80" fill="#111827"/>
  <text x="${TICKET_CODE_CENTER_X}" y="58" text-anchor="middle" fill="url(#brandGradient)" font-size="20" font-weight="700" font-family="Arial, sans-serif">
    SarradaBet
  </text>
  <text x="${TICKET_CODE_CENTER_X}" y="74" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="Arial, sans-serif">
    Ticket # ${escapeXml(input.formattedUuid)}
  </text>

  ${validatedStamp}

  <rect x="${PADDING}" y="96" width="${CONTENT_WIDTH}" height="30" rx="10" fill="${statusColor}" opacity="0.15"/>
  <text x="${TICKET_CODE_CENTER_X}" y="116" text-anchor="middle" fill="${statusColor}" font-size="13" font-weight="700" font-family="Arial, sans-serif">
    ${statusLabel}
  </text>

  <text x="${TICKET_CODE_CENTER_X}" y="${codeLabelY}" text-anchor="middle" fill="#94a3b8" font-size="18" font-family="Arial, sans-serif">
    Código do Ticket:
  </text>
  <text x="${TICKET_CODE_CENTER_X}" y="${shortCodeY}" text-anchor="middle" fill="#f8fafc" font-size="60" font-weight="700"
    font-family="monospace" letter-spacing="8">
    ${escapeXml(input.shortCode)}
  </text>
  <text x="${TICKET_CODE_CENTER_X}" y="${contactPrefixY}" text-anchor="middle" fill="#94a3b8" font-size="16" font-family="Arial, sans-serif">
    Envie este ticket para o seguinte número:
  </text>
  <text x="${TICKET_CODE_CENTER_X}" y="${phoneY}" text-anchor="middle" fill="${WHATSAPP_GOLD}" font-size="24" font-weight="700" font-family="Arial, sans-serif">
    ${escapeXml(input.whatsappPhone)}
  </text>

  <text x="${TICKET_CODE_CENTER_X}" y="${detailsStartY}" text-anchor="middle" fill="#f8fafc" font-size="20" font-weight="700" font-family="Arial, sans-serif">
    ${escapeXml(truncate(input.rewardTitle, 34))}
  </text>
  <text x="${TICKET_CODE_CENTER_X}" y="${detailsStartY + 32}" text-anchor="middle" fill="#cbd5e1" font-size="14" font-family="Arial, sans-serif">
    Usuário: ${escapeXml(truncate(input.userLabel, 32))}
  </text>
  <text x="${TICKET_CODE_CENTER_X}" y="${detailsStartY + 58}" text-anchor="middle" fill="#cbd5e1" font-size="14" font-family="Arial, sans-serif">
    Resgatado: ${escapeXml(input.redeemedAtLabel)}
  </text>
  ${validatedLine}

  <rect x="0" y="${TICKET_IMAGE_HEIGHT - 72}" width="${TICKET_IMAGE_WIDTH}" height="72" fill="#111827"/>
  <text x="${TICKET_CODE_CENTER_X}" y="${TICKET_IMAGE_HEIGHT - 48}" text-anchor="middle" fill="#64748b" font-size="11" font-family="monospace">
    UUID: ${escapeXml(truncate(input.ticketCode, 42))}
  </text>
  <text x="${TICKET_CODE_CENTER_X}" y="${TICKET_IMAGE_HEIGHT - 28}" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="Arial, sans-serif">
    Válido apenas na SarradaBet
  </text>
  <text x="${TICKET_CODE_CENTER_X}" y="${TICKET_IMAGE_HEIGHT - 12}" text-anchor="middle" fill="#64748b" font-size="10" font-family="Arial, sans-serif">
    Serial: ${escapeXml(input.serial)}
  </text>
</svg>`;
}
