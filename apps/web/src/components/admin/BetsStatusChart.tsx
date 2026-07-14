import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { BetStatus } from "../../types/bet";

const STATUS_COLORS: Record<BetStatus, string> = {
  open: "#22c55e",
  closed: "#facc15",
  resolved: "#f97316",
};

const STATUS_LABELS: Record<BetStatus, string> = {
  open: "Abertas",
  closed: "Fechadas",
  resolved: "Resolvidas",
};

interface BetsStatusChartProps {
  data: { status: BetStatus; count: number }[];
}

const BetsStatusChart: React.FC<BetsStatusChartProps> = ({ data }) => {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUS_LABELS[d.status],
      value: d.count,
      color: STATUS_COLORS[d.status],
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sportsbook-muted text-sm">
        Nenhuma aposta cadastrada
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1e",
            border: "1px solid #2a2a2e",
            borderRadius: "8px",
            color: "#f4f4f5",
            fontSize: "12px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "#8b8b95" }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default BetsStatusChart;
