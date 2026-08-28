export const DEFAULT_SORT_FIELDS = ["createdAt", "updatedAt", "id"] as const;

export const BET_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "closesAt",
  "startTime",
  "title",
  "status",
] as const;

export const CATEGORY_SORT_FIELDS = ["createdAt", "updatedAt", "title"] as const;

export const COIN_TRANSACTION_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "amount",
] as const;

const UNSAFE_SORT_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "toString",
]);

export function resolveSortField<T extends readonly string[]>(
  sortBy: string | undefined,
  allowedFields: T,
  fallback: T[number],
): T[number] {
  if (!sortBy || UNSAFE_SORT_KEYS.has(sortBy)) {
    return fallback;
  }

  return (allowedFields as readonly string[]).includes(sortBy)
    ? (sortBy as T[number])
    : fallback;
}
