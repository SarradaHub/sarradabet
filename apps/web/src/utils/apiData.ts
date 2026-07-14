import { Bet } from "../types/bet";
import { Category } from "../types/category";

export function unwrapList<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null && "data" in data) {
    const nested = (data as { data?: T[] }).data;
    return Array.isArray(nested) ? nested : [];
  }
  return [];
}

export function unwrapBet(data: unknown): Bet | null {
  if (!data || typeof data !== "object") return null;
  if ("bet" in data) return (data as { bet: Bet }).bet;
  if ("id" in data && "title" in data) return data as Bet;
  return null;
}

export function unwrapCategory(data: unknown): Category | null {
  if (!data || typeof data !== "object") return null;
  if ("category" in data) return (data as { category: Category }).category;
  if ("id" in data && "title" in data) return data as Category;
  return null;
}
