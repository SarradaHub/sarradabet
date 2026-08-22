/** Strip non-digits; drop leading 55 when present (max 11 national digits). */
export function stripPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  return digits.slice(0, 11);
}

/** Format as (DD) 99999-9999 or (DD) 9999-9999 while typing. */
export function formatPhoneMask(value: string): string {
  const digits = stripPhoneDigits(value);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/** Format API-stored phone (5511999991234) for display in inputs. */
export function formatPhoneFromApi(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const national = digits.startsWith("55") ? digits.slice(2) : digits;
  return formatPhoneMask(national);
}
