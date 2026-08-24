import { completeClaudeText, AiServiceError } from "@/lib/ai/client";
import {
  buildClassificationUserPrompt,
  CLASSIFICATION_SYSTEM_PROMPT,
  extractJsonPayload,
} from "@/lib/ai/prompts/classification";
import {
  normalizeFeatureArea,
  normalizeThemeName,
} from "@/lib/ai/theme-normalize";
import { ValidationError } from "@/lib/errors";
import {
  classificationResultSchema,
  type ClassificationResult,
} from "@/lib/validation/classification";
import { formatZodError } from "@/lib/validation/format-zod-error";

/**
 * Call Claude and return validated, normalized classification data.
 * Does not persist to the database.
 */
export async function classifyFeedbackContent(
  content: string,
): Promise<ClassificationResult> {
  if (!content.trim()) {
    throw new ValidationError("Feedback content is empty");
  }

  const raw = await completeClaudeText({
    system: CLASSIFICATION_SYSTEM_PROMPT,
    user: buildClassificationUserPrompt(content),
    maxTokens: 600,
  });

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJsonPayload(raw));
  } catch {
    throw new AiServiceError(
      "Claude returned invalid JSON. Classification was not saved.",
      502,
    );
  }

  const validated = classificationResultSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new AiServiceError(
      `Claude returned an invalid classification: ${formatZodError(validated.error)}`,
      502,
    );
  }

  const result = validated.data;

  return {
    sentiment: result.sentiment,
    sentimentScore: clamp(result.sentimentScore, -1, 1),
    confidence: clamp(result.confidence, 0, 1),
    featureArea: normalizeFeatureArea(result.featureArea),
    themes: result.themes.map((theme) => ({
      name: normalizeThemeName(theme.name),
      confidence: clamp(theme.confidence, 0, 1),
    })),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
