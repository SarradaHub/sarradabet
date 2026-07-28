import React from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { PixRevenuePoint } from "@sarradabet/types";

interface PixRevenueChartProps {
  data: PixRevenuePoint[];
}

const PixRevenueChart: React.FC<PixRevenueChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sportsbook-muted text-sm">
        Nenhuma receita Pix no período
      </div>
    );
  }

  const chartData = data.map((point) => ({
    day: point.day.slice(5),
    revenue: point.revenueCents / 100,
    payments: point.paymentCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="#2a2a2e" strokeDasharray="3 3" />
        <XAxis dataKey="day" stroke="#8b8b95" fontSize={12} />
        <YAxis stroke="#8b8b95" fontSize={12} />
        <Tooltip
          formatter={(value) => {
            const amount =
              typeof value === "number" ? value : Number(value ?? 0);
            return [
              amount.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }),
              "Receita",
            ];
          }}
          contentStyle={{
            backgroundColor: "#1a1a1e",
            border: "1px solid #2a2a2e",
            borderRadius: "8px",
            color: "#f4f4f5",
            fontSize: "12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PixRevenueChart;
