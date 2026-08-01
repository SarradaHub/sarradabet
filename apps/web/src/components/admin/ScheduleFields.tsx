import { useMemo } from "react";
import { sportsbookFieldClass } from "../ui/SportsbookModal";

interface ScheduleFieldsProps {
  startTimeLocal: string;
  closesAtLocal: string;
  onStartTimeChange: (value: string) => void;
  onClosesAtChange: (value: string) => void;
  startId?: string;
  closesId?: string;
}

const fieldClassName = `w-full rounded-lg px-3 py-2 text-sm ${sportsbookFieldClass} sb-datetime-input`;

export function ScheduleFields({
  startTimeLocal,
  closesAtLocal,
  onStartTimeChange,
  onClosesAtChange,
  startId = "startTime",
  closesId = "closesAt",
}: ScheduleFieldsProps) {
  const statusHint = useMemo(() => {
    if (!startTimeLocal) {
      return "Sem início definido — mercado aberto imediatamente.";
    }

    const start = new Date(startTimeLocal);
    if (Number.isNaN(start.getTime())) {
      return null;
    }

    return start > new Date()
      ? "Início futuro — mercado será criado como agendado."
      : "Início no passado ou presente — mercado aberto imediatamente.";
  }, [startTimeLocal]);

  return (
    <section className="sb-surface border sb-border rounded-lg p-4 space-y-3">
      <div>
        <h3 className="text-sm font-display font-semibold tracking-wide text-white uppercase">
          Agenda
        </h3>
        <p className="text-xs text-sportsbook-muted mt-1">
          Opcional. O job em background abre e fecha o mercado nos horários
          definidos.
        </p>
        {statusHint && (
          <p className="text-[11px] text-warning-400/90 mt-2">{statusHint}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={startId}
            className="block text-sm font-medium text-zinc-300 mb-1"
          >
            Início
          </label>
          <input
            id={startId}
            type="datetime-local"
            value={startTimeLocal}
            onChange={(event) => onStartTimeChange(event.target.value)}
            className={fieldClassName}
          />
        </div>
        <div>
          <label
            htmlFor={closesId}
            className="block text-sm font-medium text-zinc-300 mb-1"
          >
            Encerramento
          </label>
          <input
            id={closesId}
            type="datetime-local"
            value={closesAtLocal}
            onChange={(event) => onClosesAtChange(event.target.value)}
            className={fieldClassName}
          />
        </div>
      </div>
    </section>
  );
}

export default ScheduleFields;
