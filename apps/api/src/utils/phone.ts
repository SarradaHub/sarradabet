const BRAZILIAN_PHONE_REGEX = /^(\+?55)?\s*\(?(\d{2})\)?\s*9?\d{4}-?\d{4}$/;

export function normalizeBrazilianPhone(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.length === 12 || digits.length === 13) {
    if (digits.startsWith("55")) {
      return digits;
    }
  }

  return digits;
}

export function isValidBrazilianPhone(input: string): boolean {
  const normalized = normalizeBrazilianPhone(input);
  const withoutCountry = normalized.startsWith("55")
    ? normalized.slice(2)
    : normalized;

  if (withoutCountry.length !== 10 && withoutCountry.length !== 11) {
    return false;
  }

  const ddd = Number.parseInt(withoutCountry.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return false;
  }

  if (withoutCountry.length === 11 && withoutCountry[2] !== "9") {
    return false;
  }

  return BRAZILIAN_PHONE_REGEX.test(input.trim()) || normalized.length >= 12;
}

export function formatBrazilianPhoneForDisplay(normalized: string): string {
  const digits = normalized.startsWith("55") ? normalized.slice(2) : normalized;

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return normalized;
}
