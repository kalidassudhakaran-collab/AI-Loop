"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#10b981",
  Neutral: "#f59e0b",
  Negative: "#ef4444",
};

type VolumePoint = { date: string; count: number };
type SentimentPoint = { name: string; value: number };
type ThemePoint = { name: string; count: number; color: string };

export function VolumeChart({ data }: { data: VolumePoint[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No volume data for this date range." />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#4f46e5"
            fill="#c7d2fe"
            name="Feedback"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SentimentChart({ data }: { data: SentimentPoint[] }) {
  const filtered = data.filter((item) => item.value > 0);

  if (filtered.length === 0) {
    return <EmptyChart message="No sentiment data for this date range." />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {filtered.map((entry) => (
              <Cell
                key={entry.name}
                fill={SENTIMENT_COLORS[entry.name] ?? "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopThemesChart({ data }: { data: ThemePoint[] }) {
  if (data.length === 0) {
    return <EmptyChart message="No theme data yet. Themes appear after seeding or Week 3 AI clustering." />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="count" name="Mentions" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color || "#6366f1"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
