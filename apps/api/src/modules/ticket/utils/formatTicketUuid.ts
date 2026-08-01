export function formatTicketUuid(ticketCode: string): string {
  const compact = ticketCode.replace(/-/g, "").slice(0, 16).toUpperCase();
  const groups = compact.match(/.{1,4}/g) ?? [compact];
  return groups.slice(0, 4).join("-");
}
