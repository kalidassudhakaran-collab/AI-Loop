import { z } from "zod";

export const classificationThemeSchema = z.object({
  name: z.string().min(1).max(80),
  confidence: z.number().min(0).max(1),
});

export const classificationResultSchema = z.object({
  sentiment: z.enum(["POS", "NEU", "NEG"]),
  sentimentScore: z.number().min(-1).max(1),
  themes: z.array(classificationThemeSchema).min(1).max(5),
  featureArea: z.string().min(1).max(100),
  confidence: z.number().min(0).max(1),
});

export type ClassificationResult = z.infer<typeof classificationResultSchema>;

export const batchClassifySchema = z.object({
  feedbackIds: z
    .array(z.string().min(1))
    .min(1, "At least one feedback ID is required")
    .max(10, "Classify at most 10 items per batch request"),
});

export type BatchClassifyInput = z.infer<typeof batchClassifySchema>;
