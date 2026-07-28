import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PeakHourEntry } from "@sarradabet/types";

interface PeakHoursChartProps {
  data: PeakHourEntry[];
}

const PeakHoursChart: React.FC<PeakHoursChartProps> = ({ data }) => {
  const chartData = data.map((entry) => ({
    hour: `${String(entry.hour).padStart(2, "0")}h`,
    betCount: entry.betCount,
  }));

  const hasData = data.some((entry) => entry.betCount > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-sportsbook-muted text-sm">
        Nenhuma aposta criada no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData}>
        <CartesianGrid stroke="#2a2a2e" strokeDasharray="3 3" />
        <XAxis dataKey="hour" stroke="#8b8b95" fontSize={11} interval={2} />
        <YAxis stroke="#8b8b95" fontSize={12} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1e",
            border: "1px solid #2a2a2e",
            borderRadius: "8px",
            color: "#f4f4f5",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="betCount" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PeakHoursChart;
