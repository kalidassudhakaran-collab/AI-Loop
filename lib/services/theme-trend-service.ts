import { prisma } from "@/lib/db";
import { parseOptionalDate, toEndOfDay } from "@/lib/validation/feedback";

export type ThemeTrendQuery = {
  from?: string;
  to?: string;
  themeId?: string;
  /** Length of current window in days when from/to not provided. Default 30. */
  windowDays?: number;
};

export type ThemeTrendRow = {
  themeId: string;
  theme: string;
  color: string;
  currentCount: number;
  previousCount: number;
  changePercent: number | null;
  direction: "up" | "down" | "flat" | "new";
};

export type ThemeSeriesPoint = {
  date: string;
  count: number;
};

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveWindows(query: ThemeTrendQuery): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
} {
  const now = new Date();
  const toDate = parseOptionalDate(query.to, "to date") ?? now;
  const windowDays = query.windowDays && query.windowDays > 0 ? query.windowDays : 30;

  let currentStart: Date;
  const currentEnd: Date = toEndOfDay(toDate);

  const fromDate = parseOptionalDate(query.from, "from date");
  if (fromDate) {
    currentStart = fromDate;
  } else {
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() - (windowDays - 1));
    currentStart.setHours(0, 0, 0, 0);
  }

  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return { currentStart, currentEnd, previousStart, previousEnd };
}

async function countThemeMentions(
  workspaceId: string,
  themeId: string,
  start: Date,
  end: Date,
): Promise<number> {
  return prisma.feedbackTheme.count({
    where: {
      themeId,
      feedback: {
        workspaceId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    },
  });
}

/**
 * Period-over-period theme trends from real FeedbackTheme + Feedback dates.
 */
export async function getThemeTrends(
  workspaceId: string,
  query: ThemeTrendQuery = {},
): Promise<{
  window: {
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
  };
  themes: ThemeTrendRow[];
}> {
  const windows = resolveWindows(query);

  const themes = await prisma.theme.findMany({
    where: {
      workspaceId,
      ...(query.themeId ? { id: query.themeId } : {}),
    },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  const rows: ThemeTrendRow[] = [];

  for (const theme of themes) {
    const [currentCount, previousCount] = await Promise.all([
      countThemeMentions(
        workspaceId,
        theme.id,
        windows.currentStart,
        windows.currentEnd,
      ),
      countThemeMentions(
        workspaceId,
        theme.id,
        windows.previousStart,
        windows.previousEnd,
      ),
    ]);

    if (currentCount === 0 && previousCount === 0) {
      continue;
    }

    let changePercent: number | null = null;
    let direction: ThemeTrendRow["direction"] = "flat";

    if (previousCount === 0) {
      changePercent = currentCount > 0 ? null : 0;
      direction = currentCount > 0 ? "new" : "flat";
    } else {
      changePercent = Math.round(
        ((currentCount - previousCount) / previousCount) * 100,
      );
      if (changePercent > 0) direction = "up";
      else if (changePercent < 0) direction = "down";
      else direction = "flat";
    }

    rows.push({
      themeId: theme.id,
      theme: theme.name,
      color: theme.color,
      currentCount,
      previousCount,
      changePercent,
      direction,
    });
  }

  rows.sort((a, b) => b.currentCount - a.currentCount);

  return {
    window: {
      currentStart: windows.currentStart.toISOString(),
      currentEnd: windows.currentEnd.toISOString(),
      previousStart: windows.previousStart.toISOString(),
      previousEnd: windows.previousEnd.toISOString(),
    },
    themes: rows,
  };
}

/**
 * Daily mention series for one theme (or top theme if themeId omitted).
 */
export async function getThemeVolumeSeries(
  workspaceId: string,
  query: ThemeTrendQuery = {},
): Promise<{
  themeId: string | null;
  themeName: string | null;
  series: ThemeSeriesPoint[];
}> {
  const windows = resolveWindows(query);

  let themeId = query.themeId ?? null;
  let themeName: string | null = null;

  if (!themeId) {
    const trends = await getThemeTrends(workspaceId, query);
    themeId = trends.themes[0]?.themeId ?? null;
    themeName = trends.themes[0]?.theme ?? null;
  } else {
    const theme = await prisma.theme.findFirst({
      where: { id: themeId, workspaceId },
      select: { name: true },
    });
    themeName = theme?.name ?? null;
    if (!theme) {
      return { themeId: null, themeName: null, series: [] };
    }
  }

  if (!themeId) {
    return { themeId: null, themeName: null, series: [] };
  }

  const links = await prisma.feedbackTheme.findMany({
    where: {
      themeId,
      feedback: {
        workspaceId,
        createdAt: {
          gte: windows.currentStart,
          lte: windows.currentEnd,
        },
      },
    },
    select: {
      feedback: {
        select: { createdAt: true },
      },
    },
  });

  const counts = new Map<string, number>();
  for (const link of links) {
    const key = dayKey(link.feedback.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series: ThemeSeriesPoint[] = [];
  const cursor = new Date(windows.currentStart);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(windows.currentEnd);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const key = dayKey(cursor);
    series.push({ date: key, count: counts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return { themeId, themeName, series };
}
