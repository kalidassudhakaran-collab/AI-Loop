import { z } from "zod";

export const themeTrendQuerySchema = z.object({
  from: z.string().optional().default(""),
  to: z.string().optional().default(""),
  themeId: z.string().optional().default(""),
  windowDays: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export const updateThemeSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const createThemeSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
});

export const batchEmbedSchema = z.object({
  feedbackIds: z
    .array(z.string().min(1))
    .min(1, "At least one feedback ID is required")
    .max(20, "Embed at most 20 items per batch request"),
});

export type ThemeTrendQueryInput = z.infer<typeof themeTrendQuerySchema>;
export type BatchEmbedInput = z.infer<typeof batchEmbedSchema>;
