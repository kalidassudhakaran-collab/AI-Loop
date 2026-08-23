import { FeedbackStatus, Sentiment } from "@prisma/client";
import { z } from "zod";

export const FEEDBACK_CHANNELS = [
  "Support ticket",
  "App store review",
  "NPS survey",
  "Sales call note",
  "Community post",
] as const;

export type FeedbackChannel = (typeof FEEDBACK_CHANNELS)[number];

export const createFeedbackSchema = z.object({
  content: z.string().min(1, "Feedback content is required").max(5000),
  channel: z.enum(FEEDBACK_CHANNELS, {
    message: "Please select a valid channel",
  }),
  sourceRef: z.string().max(200).optional().nullable(),
  customerLabel: z.string().max(200).optional().nullable(),
});

export const updateFeedbackStatusSchema = z.object({
  status: z.nativeEnum(FeedbackStatus, {
    message: "Status must be NEW, REVIEWED, or ACTIONED",
  }),
});

export const feedbackQuerySchema = z.object({
  q: z.string().max(200).optional().default(""),
  channel: z.string().max(100).optional().default(""),
  sentiment: z
    .enum(["", "POS", "NEU", "NEG"])
    .optional()
    .default(""),
  themeId: z.string().max(100).optional().default(""),
  status: z
    .enum(["", "NEW", "REVIEWED", "ACTIONED"])
    .optional()
    .default(""),
  from: z.string().optional().default(""),
  to: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const dashboardQuerySchema = z.object({
  from: z.string().optional().default(""),
  to: z.string().optional().default(""),
});

export const csvRowSchema = z.object({
  content: z.string().min(1, "content is required").max(5000),
  channel: z.string().min(1, "channel is required"),
  customer_label: z.string().max(200).optional().nullable(),
  created_at: z.string().optional().nullable(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;
export type FeedbackQueryInput = z.infer<typeof feedbackQuerySchema>;
export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;

export function normalizeChannel(value: string): FeedbackChannel | null {
  const normalized = value.trim().toLowerCase();
  const match = FEEDBACK_CHANNELS.find(
    (channel) => channel.toLowerCase() === normalized,
  );
  return match ?? null;
}

export function parseOptionalDate(
  value: string | null | undefined,
  label: string,
): Date | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`invalid ${label}`);
  }

  return date;
}

export function toEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export type FeedbackListItemSentiment = Sentiment | null;
