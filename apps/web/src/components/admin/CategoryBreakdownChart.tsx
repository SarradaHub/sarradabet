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
import type { BetsByCategoryRow } from "@sarradabet/types";

interface CategoryBreakdownChartProps {
  data: BetsByCategoryRow[];
}

const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  data,
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sportsbook-muted text-sm">
        Nenhum dado por categoria no período
      </div>
    );
  }

  const chartData = data.map((row) => ({
    name: row.categoryName,
    bets: row.betCount,
    volume: row.coinVolume,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData}>
        <CartesianGrid stroke="#2a2a2e" strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke="#8b8b95" fontSize={11} />
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
        <Bar dataKey="volume" fill="#38bdf8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CategoryBreakdownChart;
