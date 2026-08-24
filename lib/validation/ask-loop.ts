import { z } from "zod";

export const askQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Question must be at least 3 characters")
    .max(1000, "Question must be at most 1000 characters"),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;

export const askLoopCitationSchema = z.object({
  feedbackId: z.string().min(1),
  reason: z.string().min(1).max(500).optional(),
});

export const askLoopClaudeAnswerSchema = z.object({
  answer: z.string().min(1).max(4000),
  citations: z.array(askLoopCitationSchema).max(20),
});

export type AskLoopClaudeAnswer = z.infer<typeof askLoopClaudeAnswerSchema>;

export const ASK_LOOP_STATUSES = [
  "ANSWERED",
  "INSUFFICIENT_EVIDENCE",
  "EMBEDDING_PROVIDER_UNAVAILABLE",
  "NO_EMBEDDINGS",
  "AI_PROVIDER_UNAVAILABLE",
  "ERROR",
] as const;

export type AskLoopStatus = (typeof ASK_LOOP_STATUSES)[number];
