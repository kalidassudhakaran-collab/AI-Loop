import { z } from "zod";

export const FEEDBACK_CHANNELS = [
  "Support ticket",
  "App store review",
  "NPS survey",
  "Sales call note",
  "Community post",
] as const;

export const createFeedbackSchema = z.object({
  content: z.string().min(1, "Feedback content is required").max(5000),
  channel: z.enum(FEEDBACK_CHANNELS, {
    message: "Please select a valid channel",
  }),
  sourceRef: z.string().max(200).optional().nullable(),
  customerLabel: z.string().max(200).optional().nullable(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
