import { extractJsonPayload } from "@/lib/ai/prompts/classification";
import { completeAiText, AiServiceError } from "@/lib/ai/client";
import { isAiConfigured } from "@/lib/ai/config";
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
  source?: "ai" | "evidence_summary";
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
    source: "ai",
  };
}

/**
 * Build a grounded answer only from retrieved evidence quotes.
 * Used when the LLM is rate-limited or unavailable — never invents feedback.
 */
export function buildEvidenceSummaryAnswer(params: {
  question: string;
  evidence: AskLoopEvidenceItem[];
}): ValidatedAskLoopAnswer {
  const evidence = params.evidence;
  if (evidence.length === 0) {
    return {
      answer:
        "I don't have enough relevant feedback evidence to answer that confidently.",
      citations: [],
      source: "evidence_summary",
    };
  }

  const sentimentCounts = { POS: 0, NEU: 0, NEG: 0, UNKNOWN: 0 };
  for (const item of evidence) {
    if (item.sentiment === "POS") sentimentCounts.POS += 1;
    else if (item.sentiment === "NEU") sentimentCounts.NEU += 1;
    else if (item.sentiment === "NEG") sentimentCounts.NEG += 1;
    else sentimentCounts.UNKNOWN += 1;
  }

  const toneParts: string[] = [];
  if (sentimentCounts.NEG)
    toneParts.push(`${sentimentCounts.NEG} negative`);
  if (sentimentCounts.POS)
    toneParts.push(`${sentimentCounts.POS} positive`);
  if (sentimentCounts.NEU)
    toneParts.push(`${sentimentCounts.NEU} neutral`);

  const bullets = evidence
    .slice(0, 5)
    .map((item, index) => {
      const sentiment = item.sentiment ? ` (${item.sentiment})` : "";
      return `${index + 1}. [${item.feedbackId}]${sentiment} ${item.contentPreview}`;
    })
    .join("\n");

  const answer = [
    `Based on ${evidence.length} retrieved feedback item(s) about your question (“${params.question.trim()}”), the tone mix is ${toneParts.join(", ") || "mixed/unclassified"}.`,
    "",
    "Key verbatim evidence:",
    bullets,
    "",
    "This summary was assembled only from retrieved workspace feedback (AI narrative unavailable due to provider limits).",
  ].join("\n");

  return {
    answer,
    citations: evidence.map((item) => ({
      feedbackId: item.feedbackId,
      reason: "Retrieved as semantically relevant evidence",
    })),
    source: "evidence_summary",
  };
}

export async function generateGroundedAskLoopAnswer(params: {
  question: string;
  evidence: AskLoopEvidenceItem[];
}): Promise<ValidatedAskLoopAnswer> {
  if (!isAiConfigured()) {
    throw new AiServiceError(
      "AI answer generation is not configured. ADD API: set GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in .env.",
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

  const completion = await completeAiText({
    system: ASK_LOOP_SYSTEM_PROMPT,
    user: buildAskLoopUserPrompt(params),
    maxTokens: 1000,
  });
  const rawText = completion.text;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJsonPayload(rawText));
  } catch {
    throw new AiServiceError(
      "AI provider returned invalid JSON for Ask LOOP.",
      502,
    );
  }

  const validated = askLoopClaudeAnswerSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new AiServiceError(
      `AI provider returned an invalid Ask LOOP answer: ${formatZodError(validated.error)}`,
      502,
    );
  }

  const firstPass = validateCitations(validated.data, evidenceIds);

  // If the model cited only invalid IDs but produced an answer, keep answer with empty citations.
  // If answer is empty after scrubbing, treat as failure.
  if (!firstPass.answer) {
    throw new AiServiceError(
      "AI provider returned an empty or unsupported Ask LOOP answer.",
      502,
    );
  }

  return firstPass;
}
