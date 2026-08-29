import { Sentiment } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toEndOfDay } from "@/lib/validation/feedback";
import type { VocReportStats } from "@/lib/validation/reports";

type SentimentCounts = {
  POS: number;
  NEU: number;
  NEG: number;
  UNCLASSIFIED: number;
};

function emptySentiment(): SentimentCounts {
  return { POS: 0, NEU: 0, NEG: 0, UNCLASSIFIED: 0 };
}

function tallySentiment(values: Array<Sentiment | null>): SentimentCounts {
  const counts = emptySentiment();
  for (const value of values) {
    if (value === "POS") counts.POS += 1;
    else if (value === "NEU") counts.NEU += 1;
    else if (value === "NEG") counts.NEG += 1;
    else counts.UNCLASSIFIED += 1;
  }
  return counts;
}

function percent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? null : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function direction(
  current: number,
  previous: number,
): "up" | "down" | "flat" | "new" {
  if (previous === 0) {
    return current > 0 ? "new" : "flat";
  }
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

export async function computeVocReportStats(
  workspaceId: string,
  from: Date,
  to: Date,
): Promise<VocReportStats> {
  const periodStart = new Date(from);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = toEndOfDay(to);

  const durationMs = periodEnd.getTime() - periodStart.getTime();
  const previousEnd = new Date(periodStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  const currentWhere = {
    workspaceId,
    createdAt: { gte: periodStart, lte: periodEnd },
  };
  const previousWhere = {
    workspaceId,
    createdAt: { gte: previousStart, lte: previousEnd },
  };

  const [currentRows, previousRows, currentThemeGroups, previousThemeGroups] =
    await Promise.all([
      prisma.feedback.findMany({
        where: currentWhere,
        select: {
          id: true,
          content: true,
          channel: true,
          sentiment: true,
          sentimentScore: true,
          customerLabel: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.feedback.findMany({
        where: previousWhere,
        select: { sentiment: true },
      }),
      prisma.feedbackTheme.groupBy({
        by: ["themeId"],
        where: { feedback: currentWhere },
        _count: { themeId: true },
        orderBy: { _count: { themeId: "desc" } },
        take: 8,
      }),
      prisma.feedbackTheme.groupBy({
        by: ["themeId"],
        where: { feedback: previousWhere },
        _count: { themeId: true },
      }),
    ]);

  const currentSentiment = tallySentiment(currentRows.map((row) => row.sentiment));
  const previousSentiment = tallySentiment(
    previousRows.map((row) => row.sentiment),
  );

  const channelMap = new Map<string, number>();
  for (const row of currentRows) {
    channelMap.set(row.channel, (channelMap.get(row.channel) ?? 0) + 1);
  }
  const channels = Array.from(channelMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const previousThemeCount = new Map(
    previousThemeGroups.map((group) => [group.themeId, group._count.themeId]),
  );

  const themeIds = currentThemeGroups.map((group) => group.themeId);
  const themes = themeIds.length
    ? await prisma.theme.findMany({
        where: { workspaceId, id: { in: themeIds } },
        select: { id: true, name: true, color: true },
      })
    : [];
  const themeById = new Map(themes.map((theme) => [theme.id, theme]));

  const topThemes = currentThemeGroups
    .map((group) => {
      const theme = themeById.get(group.themeId);
      if (!theme) return null;
      const count = group._count.themeId;
      const previousCount = previousThemeCount.get(group.themeId) ?? 0;
      return {
        themeId: theme.id,
        name: theme.name,
        color: theme.color,
        count,
        previousCount,
        changePercent: changePercent(count, previousCount),
        direction: direction(count, previousCount),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const scored = [...currentRows].sort((a, b) => {
    const aScore = Math.abs(a.sentimentScore ?? 0);
    const bScore = Math.abs(b.sentimentScore ?? 0);
    return bScore - aScore;
  });

  const negatives = scored.filter((row) => row.sentiment === "NEG").slice(0, 3);
  const positives = scored.filter((row) => row.sentiment === "POS").slice(0, 2);
  const usedIds = new Set([...negatives, ...positives].map((row) => row.id));
  const extras = currentRows.filter((row) => !usedIds.has(row.id)).slice(0, 3);

  const quotes = [...negatives, ...positives, ...extras].map((row) => ({
    feedbackId: row.id,
    content: row.content,
    channel: row.channel,
    sentiment: row.sentiment,
    customerLabel: row.customerLabel,
    createdAt: row.createdAt.toISOString(),
  }));

  const total = currentRows.length;
  const previousTotal = previousRows.length;

  const stats: VocReportStats = {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    previousStart: previousStart.toISOString(),
    previousEnd: previousEnd.toISOString(),
    total,
    previousTotal,
    volumeChangePercent: changePercent(total, previousTotal),
    sentiment: {
      POS: currentSentiment.POS,
      NEU: currentSentiment.NEU,
      NEG: currentSentiment.NEG,
      UNCLASSIFIED: currentSentiment.UNCLASSIFIED,
      negativePercent: percent(currentSentiment.NEG, total),
      previousNegativePercent: percent(previousSentiment.NEG, previousTotal),
      previous: {
        POS: previousSentiment.POS,
        NEU: previousSentiment.NEU,
        NEG: previousSentiment.NEG,
      },
    },
    channels,
    topThemes,
    quotes,
  };

  return stats;
}
