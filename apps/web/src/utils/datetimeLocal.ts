/** Converts ISO/Date to `datetime-local` input value (local timezone). */
export function toDatetimeLocalValue(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === "") {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts `datetime-local` input value to ISO string for the API. */
export function fromDatetimeLocalValue(value: string): string | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}
