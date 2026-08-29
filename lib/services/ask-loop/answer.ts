import { extractJsonPayload } from "@/lib/ai/prompts/classification";
import { completeClaudeText, AiServiceError } from "@/lib/ai/client";
import { isAnthropicConfigured } from "@/lib/ai/config";
import {
  buildAskLoopUserPrompt,
  ASK_LOOP_SYSTEM_PROMPT,
} from "@/lib/services/ask-loop/prompt";
import type { AskLoopEvidenceItem } from "@/lib/services/ask-loop/retrieve";
import {
  askLoopClaudeAnswerSchema,
  type AskLoopClaudeAnswer,
} from "@/lib/validation/ask-loop";
import { formatZodError } from "@/lib/validation/format-zod-error";

export type ValidatedAskLoopAnswer = {
  answer: string;
  citations: Array<{
    feedbackId: string;
    reason?: string;
  }>;
};

/**
 * Strip citation IDs that were not in the supplied evidence set.
 * Never invents IDs; never allows cross-set citations.
 */
export function validateCitations(
  raw: AskLoopClaudeAnswer,
  evidenceIds: Set<string>,
): ValidatedAskLoopAnswer {
  const citations = raw.citations.filter((citation) =>
    evidenceIds.has(citation.feedbackId),
  );

  // Also scrub bracket citations in the answer text that aren't allowed.
  const scrubbedAnswer = raw.answer.replace(
    /\[([a-zA-Z0-9_-]+)\]/g,
    (match, id: string) => (evidenceIds.has(id) ? match : ""),
  );

  return {
    answer: scrubbedAnswer.replace(/\s{2,}/g, " ").trim(),
    citations,
  };
}

export async function generateGroundedAskLoopAnswer(params: {
  question: string;
  evidence: AskLoopEvidenceItem[];
}): Promise<ValidatedAskLoopAnswer> {
  if (!isAnthropicConfigured()) {
    throw new AiServiceError(
      "AI answer generation is not configured. ADD API: set ANTHROPIC_API_KEY in .env.",
      503,
    );
  }

  if (params.evidence.length === 0) {
    throw new AiServiceError(
      "Cannot generate an answer without evidence.",
      400,
    );
  }

  const evidenceIds = new Set(params.evidence.map((item) => item.feedbackId));

  const rawText = await completeClaudeText({
    system: ASK_LOOP_SYSTEM_PROMPT,
    user: buildAskLoopUserPrompt(params),
    maxTokens: 1000,
  });

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJsonPayload(rawText));
  } catch {
    throw new AiServiceError(
      "Claude returned invalid JSON for Ask LOOP.",
      502,
    );
  }

  const validated = askLoopClaudeAnswerSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new AiServiceError(
      `Claude returned an invalid Ask LOOP answer: ${formatZodError(validated.error)}`,
      502,
    );
  }

  const firstPass = validateCitations(validated.data, evidenceIds);

  // If Claude cited only invalid IDs but produced an answer, keep answer with empty citations.
  // If answer is empty after scrubbing, treat as failure.
  if (!firstPass.answer) {
    throw new AiServiceError(
      "Claude returned an empty or unsupported Ask LOOP answer.",
      502,
    );
  }

  return firstPass;
}
