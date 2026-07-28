import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatScheduleDate(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === "") {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}
