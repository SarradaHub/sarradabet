import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export interface BetOddVotesGroup {
  betId: number;
  betTitle: string;
  odds: { title: string; votes: number; value: number }[];
}

interface BetOddVotesChartProps {
  data: BetOddVotesGroup[];
}

const ODD_COLORS = [
  "#22c55e",
  "#facc15",
  "#f97316",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#ef4444",
  "#8b5cf6",
];

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

type ChartRow = Record<string, string | number | undefined>;

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number;
    color?: string;
    payload?: ChartRow;
  }>;
}

function BetOddTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  const entries = payload.filter(
    (entry) => typeof entry.value === "number" && entry.value > 0,
  );

  return (
    <div
      style={{
        backgroundColor: "#1a1a1e",
        border: "1px solid #2a2a2e",
        borderRadius: "8px",
        padding: "10px 12px",
        fontSize: "12px",
        color: "#f4f4f5",
      }}
    >
      <p className="font-semibold mb-2">{row.betFullTitle}</p>
      <div className="space-y-1">
        {entries.map((entry) => {
          const index = String(entry.dataKey).replace("votes_", "");
          const label = row[`label_${index}`];
          const value = row[`value_${index}`];
          return (
            <p key={entry.dataKey} style={{ color: entry.color }}>
              {label}: {entry.value} votos ·{" "}
              {typeof value === "number" ? `${value.toFixed(2)}x` : "—"}
            </p>
          );
        })}
      </div>
    </div>
  );
}

const BetOddVotesChart: React.FC<BetOddVotesChartProps> = ({ data }) => {
  const { chartRows, maxOdds } = useMemo(() => {
    const max = Math.max(1, ...data.map((bet) => bet.odds.length));

    const rows: ChartRow[] = data.map((bet) => {
      const row: ChartRow = {
        betTitle: truncate(bet.betTitle, 18),
        betFullTitle: bet.betTitle,
      };

      bet.odds.forEach((odd, index) => {
        row[`votes_${index}`] = odd.votes;
        row[`label_${index}`] = odd.title;
        row[`value_${index}`] = odd.value;
      });

      return row;
    });

    return { chartRows: rows, maxOdds: max };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sportsbook-muted text-sm">
        Nenhuma aposta cadastrada
      </div>
    );
  }

  const chartHeight = Math.max(220, data.length * 28);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={chartRows}
        margin={{ top: 8, right: 8, left: -20, bottom: 48 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#2a2a2e"
          vertical={false}
        />
        <XAxis
          dataKey="betTitle"
          tick={{ fill: "#8b8b95", fontSize: 10 }}
          axisLine={{ stroke: "#2a2a2e" }}
          tickLine={false}
          angle={-25}
          textAnchor="end"
          interval={0}
          height={56}
        />
        <YAxis
          tick={{ fill: "#8b8b95", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<BetOddTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#8b8b95", paddingTop: "8px" }}
          iconType="circle"
        />
        {Array.from({ length: maxOdds }).map((_, index) => (
          <Bar
            key={index}
            dataKey={`votes_${index}`}
            fill={ODD_COLORS[index % ODD_COLORS.length]}
            radius={[4, 4, 0, 0]}
            name={`Odd ${index + 1}`}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BetOddVotesChart;
