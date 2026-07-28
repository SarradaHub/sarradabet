export function formatTicketSerial(redemptionId: number, date: Date): string {
  const year = date.getFullYear();
  const serial = String(redemptionId).padStart(5, "0");
  return `SARR-${year}-${serial}`;
}
