import { Prisma } from "@prisma/client";
import { extractJsonPayload } from "@/lib/ai/prompts/classification";
import {
  VOC_REPORT_SYSTEM_PROMPT,
  buildVocReportUserPrompt,
} from "@/lib/ai/prompts/voc-report";
import { completeClaudeText } from "@/lib/ai/client";
import { getAnthropicModel, isAnthropicConfigured } from "@/lib/ai/config";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { computeVocReportStats } from "@/lib/services/report-stats";
import { parseOptionalDate } from "@/lib/validation/feedback";
import { formatZodError } from "@/lib/validation/format-zod-error";
import {
  vocClaudeNarrativeSchema,
  vocReportContentSchema,
  type GenerateReportInput,
  type VocClaudeNarrative,
  type VocReportContent,
  type VocReportStats,
} from "@/lib/validation/reports";

function formatRangeLabel(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function formatChange(value: number | null, previousWasZero: boolean): string {
  if (previousWasZero && value === null) return "new vs previous period";
  if (value === null) return "n/a vs previous period";
  if (value === 0) return "unchanged vs previous period";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}% vs previous period`;
}

function buildDeterministicNarrative(
  stats: VocReportStats,
): VocClaudeNarrative {
  const range = formatRangeLabel(stats.periodStart, stats.periodEnd);
  const volumeLabel = formatChange(
    stats.volumeChangePercent,
    stats.previousTotal === 0,
  );

  const themeInsights =
    stats.topThemes.length > 0
      ? stats.topThemes.slice(0, 5).map((theme) => {
          const change = formatChange(
            theme.changePercent,
            theme.previousCount === 0,
          );
          return `${theme.name} appeared in ${theme.count} items this period (${change}; ${theme.previousCount} previously).`;
        })
      : [
          "No themes were linked to feedback in this period. Classify items or widen the date range.",
        ];

  const leadingTheme = stats.topThemes[0];
  const recommendedActions: VocClaudeNarrative["recommendedActions"] =
    stats.total === 0
      ? [
          {
            title: "Collect more feedback",
            rationale:
              "This period has no items, so there is nothing to prioritise yet.",
            priority: "high",
          },
        ]
      : [
          ...(leadingTheme
            ? [
                {
                  title: `Investigate ${leadingTheme.name}`,
                  rationale: `${leadingTheme.name} is the highest-volume theme (${leadingTheme.count} mentions). Review the linked inbox items before the next planning cycle.`,
                  priority:
                    leadingTheme.direction === "up" ||
                    leadingTheme.direction === "new"
                      ? ("high" as const)
                      : ("medium" as const),
                },
              ]
            : []),
          {
            title: "Triage remaining negative items",
            rationale: `${stats.sentiment.NEG} items (${stats.sentiment.negativePercent}%) are negative this period versus ${stats.sentiment.previousNegativePercent}% last period.`,
            priority: stats.sentiment.negativePercent >= 40 ? "high" : "medium",
          },
          {
            title: "Share this digest with leadership",
            rationale:
              "The numbers and quotes below are taken from workspace feedback for this window — forward as-is.",
            priority: "low",
          },
        ];

  const highlightedQuotes = stats.quotes.slice(0, 4).map((quote) => ({
    feedbackId: quote.feedbackId,
    whyItMatters:
      quote.sentiment === "NEG"
        ? "Representative complaint from this period."
        : quote.sentiment === "POS"
          ? "Representative praise from this period."
          : "Representative verbatim from this period.",
  }));

  return {
    title: `Voice of Customer — ${range}`,
    executiveSummary:
      stats.total === 0
        ? `No customer feedback was recorded between ${range}. Widen the date range or ingest more items before generating a leadership digest.`
        : `LOOP recorded ${stats.total} feedback items between ${range} (${volumeLabel}; ${stats.previousTotal} in the previous window). Negative sentiment is ${stats.sentiment.negativePercent}% (was ${stats.sentiment.previousNegativePercent}%). ${
            leadingTheme
              ? `${leadingTheme.name} is the leading theme with ${leadingTheme.count} mentions.`
              : "No themes are linked yet."
          }`,
    themeInsights,
    sentimentNarrative: `Positive ${stats.sentiment.POS}, neutral ${stats.sentiment.NEU}, negative ${stats.sentiment.NEG}, unclassified ${stats.sentiment.UNCLASSIFIED}. Previous window: positive ${stats.sentiment.previous.POS}, neutral ${stats.sentiment.previous.NEU}, negative ${stats.sentiment.previous.NEG}.`,
    recommendedActions,
    highlightedQuotes,
  };
}

function sanitizeNarrative(
  narrative: VocClaudeNarrative,
  stats: VocReportStats,
): VocClaudeNarrative {
  const allowedIds = new Set(stats.quotes.map((quote) => quote.feedbackId));
  const highlightedQuotes = narrative.highlightedQuotes.filter((item) =>
    allowedIds.has(item.feedbackId),
  );

  return {
    ...narrative,
    highlightedQuotes,
  };
}

async function generateNarrative(
  stats: VocReportStats,
): Promise<{ narrative: VocClaudeNarrative; source: "claude" | "deterministic"; model: string | null }> {
  if (!isAnthropicConfigured() || stats.total === 0) {
    return {
      narrative: buildDeterministicNarrative(stats),
      source: "deterministic",
      model: null,
    };
  }

  try {
    const rawText = await completeClaudeText({
      system: VOC_REPORT_SYSTEM_PROMPT,
      user: buildVocReportUserPrompt(stats),
      maxTokens: 1600,
    });

    const parsedJson: unknown = JSON.parse(extractJsonPayload(rawText));
    const parsed = vocClaudeNarrativeSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    return {
      narrative: sanitizeNarrative(parsed.data, stats),
      source: "claude",
      model: getAnthropicModel(),
    };
  } catch (error) {
    console.error(
      "VoC Claude narrative failed; using deterministic copy:",
      error instanceof Error ? error.message : error,
    );
    return {
      narrative: buildDeterministicNarrative(stats),
      source: "deterministic",
      model: null,
    };
  }
}

export async function generateVocReport(params: {
  workspaceId: string;
  userId: string;
  input: GenerateReportInput;
}) {
  const from = parseOptionalDate(params.input.from, "start date");
  const to = parseOptionalDate(params.input.to, "end date");
  if (!from || !to) {
    throw new ValidationError("A valid start and end date are required");
  }

  const stats = await computeVocReportStats(params.workspaceId, from, to);
  const { narrative, source, model } = await generateNarrative(stats);

  const content: VocReportContent = {
    stats,
    narrative,
    source,
    model,
    generatedAt: new Date().toISOString(),
  };

  const title =
    params.input.title?.trim() ||
    narrative.title ||
    `Voice of Customer — ${formatRangeLabel(stats.periodStart, stats.periodEnd)}`;

  const report = await prisma.report.create({
    data: {
      title,
      periodStart: new Date(stats.periodStart),
      periodEnd: new Date(stats.periodEnd),
      contentJson: content as Prisma.InputJsonValue,
      workspaceId: params.workspaceId,
      generatedBy: params.userId,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return serializeReport(report);
}

export async function listWorkspaceReports(workspaceId: string) {
  const reports = await prisma.report.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return reports.map(serializeReportListItem);
}

export async function getWorkspaceReport(workspaceId: string, reportId: string) {
  const report = await prisma.report.findFirst({
    where: { id: reportId, workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  return serializeReport(report);
}

type ReportRecord = Prisma.ReportGetPayload<{
  include: {
    user: {
      select: { id: true; name: true; email: true };
    };
  };
}>;

function parseContent(json: Prisma.JsonValue): VocReportContent {
  const parsed = vocReportContentSchema.safeParse(json);
  if (!parsed.success) {
    throw new ValidationError("Stored report content is invalid");
  }
  return parsed.data;
}

function serializeReportListItem(report: ReportRecord) {
  return {
    id: report.id,
    title: report.title,
    periodStart: report.periodStart.toISOString(),
    periodEnd: report.periodEnd.toISOString(),
    createdAt: report.createdAt.toISOString(),
    generatedBy: report.user,
  };
}

function serializeReport(report: ReportRecord) {
  return {
    ...serializeReportListItem(report),
    content: parseContent(report.contentJson),
  };
}
