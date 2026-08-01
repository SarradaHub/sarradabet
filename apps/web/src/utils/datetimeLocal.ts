function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Converts ISO/Date to `datetime-local` input value (local timezone). */
export function toDatetimeLocalValue(
  value?: string | Date | null,
): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts `datetime-local` input value to ISO string for the API. */
export function fromDatetimeLocalValue(
  value: string,
): string | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}
