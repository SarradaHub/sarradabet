import React from "react";
import type { Category } from "../../types/category";
import { Button } from "../ui/Button";

interface AnalyticsDateFilterProps {
  startDate: string;
  endDate: string;
  categoryId?: number;
  categories: Category[];
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCategoryChange: (value: number | undefined) => void;
  onExport: () => void;
  exporting?: boolean;
}

const AnalyticsDateFilter: React.FC<AnalyticsDateFilterProps> = ({
  startDate,
  endDate,
  categoryId,
  categories,
  onStartDateChange,
  onEndDateChange,
  onCategoryChange,
  onExport,
  exporting = false,
}) => {
  return (
    <div className="sb-surface-raised border sb-border rounded-lg p-4 flex flex-col lg:flex-row lg:items-end gap-4">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1 text-sm">
          <span className="text-sportsbook-muted">Data inicial</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="w-full sb-surface border sb-border rounded-lg px-3 py-2 text-white"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-sportsbook-muted">Data final</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="w-full sb-surface border sb-border rounded-lg px-3 py-2 text-white"
          />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="text-sportsbook-muted">Categoria</span>
          <select
            value={categoryId ?? ""}
            onChange={(event) =>
              onCategoryChange(
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className="w-full sb-surface border sb-border rounded-lg px-3 py-2 text-white"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button
        variant="secondary"
        onClick={onExport}
        disabled={exporting}
        className="shrink-0"
      >
        {exporting ? "Exportando..." : "Exportar CSV"}
      </Button>
    </div>
  );
};

export default AnalyticsDateFilter;
