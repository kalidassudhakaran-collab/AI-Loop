import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { DashboardQueryInput } from "@/lib/validation/feedback";
import { parseOptionalDate, toEndOfDay } from "@/lib/validation/feedback";

function buildDateWhere(
  workspaceId: string,
  filters: DashboardQueryInput,
): Prisma.FeedbackWhereInput {
  const where: Prisma.FeedbackWhereInput = { workspaceId };

  const fromDate = parseOptionalDate(filters.from, "from date");
  const toDate = parseOptionalDate(filters.to, "to date");

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) {
      where.createdAt.gte = fromDate;
    }
    if (toDate) {
      where.createdAt.lte = toEndOfDay(toDate);
    }
  }

  return where;
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDashboardData(
  workspaceId: string,
  filters: DashboardQueryInput,
) {
  const where = buildDateWhere(workspaceId, filters);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [total, negativeCount, newThisWeek, feedbackRows, themeGroups] =
    await Promise.all([
      prisma.feedback.count({ where }),
      prisma.feedback.count({
        where: { ...where, sentiment: "NEG" },
      }),
      prisma.feedback.count({
        where: {
          workspaceId,
          createdAt: { gte: weekAgo },
        },
      }),
      prisma.feedback.findMany({
        where,
        select: {
          createdAt: true,
          sentiment: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.feedbackTheme.groupBy({
        by: ["themeId"],
        where: {
          feedback: where,
        },
        _count: {
          themeId: true,
        },
        orderBy: {
          _count: {
            themeId: "desc",
          },
        },
        take: 8,
      }),
    ]);

  const volumeMap = new Map<string, number>();
  for (const row of feedbackRows) {
    const key = formatDay(row.createdAt);
    volumeMap.set(key, (volumeMap.get(key) ?? 0) + 1);
  }

  const volumeOverTime = Array.from(volumeMap.entries()).map(
    ([date, count]) => ({ date, count }),
  );

  const sentimentCounts = {
    POS: 0,
    NEU: 0,
    NEG: 0,
    UNCLASSIFIED: 0,
  };

  for (const row of feedbackRows) {
    if (row.sentiment === "POS") sentimentCounts.POS += 1;
    else if (row.sentiment === "NEU") sentimentCounts.NEU += 1;
    else if (row.sentiment === "NEG") sentimentCounts.NEG += 1;
    else sentimentCounts.UNCLASSIFIED += 1;
  }

  const sentimentBreakdown = [
    { name: "Positive", key: "POS", value: sentimentCounts.POS },
    { name: "Neutral", key: "NEU", value: sentimentCounts.NEU },
    { name: "Negative", key: "NEG", value: sentimentCounts.NEG },
  ];

  const themeIds = themeGroups.map((group) => group.themeId);
  const themes = themeIds.length
    ? await prisma.theme.findMany({
        where: {
          workspaceId,
          id: { in: themeIds },
        },
        select: { id: true, name: true, color: true },
      })
    : [];

  const themeById = new Map(themes.map((theme) => [theme.id, theme]));

  const topThemes = themeGroups
    .map((group) => {
      const theme = themeById.get(group.themeId);
      if (!theme) return null;
      return {
        themeId: theme.id,
        name: theme.name,
        color: theme.color,
        count: group._count.themeId,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const negativePercent =
    total === 0 ? 0 : Math.round((negativeCount / total) * 100);

  return {
    stats: {
      total,
      negativePercent,
      newThisWeek,
    },
    volumeOverTime,
    sentimentBreakdown,
    topThemes,
  };
}
