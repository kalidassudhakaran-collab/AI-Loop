import { z } from "zod";

export const generateReportSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    from: z.string().min(1, "Start date is required"),
    to: z.string().min(1, "End date is required"),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.from);
    const end = new Date(value.to);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Start date is invalid",
        path: ["from"],
      });
    }
    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "End date is invalid",
        path: ["to"],
      });
    }
    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      start > end
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Start date must be on or before end date",
        path: ["from"],
      });
    }
  });

export type GenerateReportInput = z.infer<typeof generateReportSchema>;

export const vocActionPrioritySchema = z.enum(["high", "medium", "low"]);

export const vocClaudeNarrativeSchema = z.object({
  title: z.string().min(1).max(200),
  executiveSummary: z.string().min(1).max(4000),
  themeInsights: z.array(z.string().min(1).max(800)).min(1).max(8),
  sentimentNarrative: z.string().min(1).max(2000),
  recommendedActions: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        rationale: z.string().min(1).max(800),
        priority: vocActionPrioritySchema,
      }),
    )
    .min(1)
    .max(8),
  highlightedQuotes: z
    .array(
      z.object({
        feedbackId: z.string().min(1),
        whyItMatters: z.string().min(1).max(500),
      }),
    )
    .max(8),
});

export type VocClaudeNarrative = z.infer<typeof vocClaudeNarrativeSchema>;

export const vocQuoteSchema = z.object({
  feedbackId: z.string(),
  content: z.string(),
  channel: z.string(),
  sentiment: z.enum(["POS", "NEU", "NEG"]).nullable(),
  customerLabel: z.string().nullable(),
  createdAt: z.string(),
});

export const vocThemeStatSchema = z.object({
  themeId: z.string(),
  name: z.string(),
  color: z.string(),
  count: z.number().int(),
  previousCount: z.number().int(),
  changePercent: z.number().nullable(),
  direction: z.enum(["up", "down", "flat", "new"]),
});

export const vocReportStatsSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  previousStart: z.string(),
  previousEnd: z.string(),
  total: z.number().int(),
  previousTotal: z.number().int(),
  volumeChangePercent: z.number().nullable(),
  sentiment: z.object({
    POS: z.number().int(),
    NEU: z.number().int(),
    NEG: z.number().int(),
    UNCLASSIFIED: z.number().int(),
    negativePercent: z.number(),
    previousNegativePercent: z.number(),
    previous: z.object({
      POS: z.number().int(),
      NEU: z.number().int(),
      NEG: z.number().int(),
    }),
  }),
  channels: z.array(
    z.object({
      name: z.string(),
      count: z.number().int(),
    }),
  ),
  topThemes: z.array(vocThemeStatSchema),
  quotes: z.array(vocQuoteSchema),
});

export type VocReportStats = z.infer<typeof vocReportStatsSchema>;

export const vocReportContentSchema = z.object({
  stats: vocReportStatsSchema,
  narrative: vocClaudeNarrativeSchema,
  source: z.enum(["claude", "deterministic"]),
  model: z.string().nullable(),
  generatedAt: z.string(),
});

export type VocReportContent = z.infer<typeof vocReportContentSchema>;
