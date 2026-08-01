export function formatPartialVoteMessage(
  succeeded: number,
  total: number,
): string | null {
  if (succeeded <= 0 || succeeded >= total) {
    return null;
  }

  return `${succeeded} de ${total} votos registrados. Corrija os demais e tente novamente.`;
}
