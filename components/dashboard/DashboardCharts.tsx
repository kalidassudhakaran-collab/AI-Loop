"use client";

import Link from "next/link";
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
type ThemePoint = { themeId?: string; name: string; count: number; color: string };

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
    <div>
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
      <ul className="mt-3 flex flex-wrap gap-2 text-sm">
        {data.map((theme) =>
          theme.themeId ? (
            <li key={theme.themeId}>
              <Link
                href={`/inbox?themeId=${theme.themeId}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-indigo-700 hover:bg-indigo-50 hover:underline"
              >
                {theme.name} ({theme.count})
              </Link>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

type TrendSeriesPoint = { date: string; count: number };

export function ThemeTrendLineChart({
  data,
  themeName,
}: {
  data: TrendSeriesPoint[];
  themeName: string | null;
}) {
  if (data.length === 0) {
    return (
      <EmptyChart message="No theme trend series for this date window." />
    );
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
            stroke="#0ea5e9"
            fill="#bae6fd"
            name={themeName ?? "Theme mentions"}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type ChangeRow = {
  themeId?: string;
  theme: string;
  currentCount: number;
  previousCount: number;
  changePercent: number | null;
  direction: string;
  color: string;
};

export function ThemeChangeTable({ rows }: { rows: ChangeRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        No theme mentions in the selected periods.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Theme</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Current</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Previous</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.themeId ?? row.theme}>
              <td className="px-4 py-3 font-medium text-slate-900">
                {row.themeId ? (
                  <Link
                    href={`/inbox?themeId=${row.themeId}`}
                    className="text-indigo-700 hover:underline"
                  >
                    {row.theme}
                  </Link>
                ) : (
                  row.theme
                )}
              </td>
              <td className="px-4 py-3 text-slate-700">{row.currentCount}</td>
              <td className="px-4 py-3 text-slate-700">{row.previousCount}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    row.direction === "up"
                      ? "text-emerald-700"
                      : row.direction === "down"
                        ? "text-red-700"
                        : "text-slate-600"
                  }
                >
                  {row.changePercent === null
                    ? row.direction === "new"
                      ? "New"
                      : "—"
                    : `${row.changePercent > 0 ? "+" : ""}${row.changePercent}%`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
