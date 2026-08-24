import type { AskLoopEvidenceItem } from "@/lib/services/ask-loop/retrieve";

export const ASK_LOOP_SYSTEM_PROMPT = `You are Ask LOOP, a grounded customer-feedback assistant.

You MUST answer ONLY from the supplied EVIDENCE records.
Do not use outside knowledge.
Do not invent customer feedback, quotes, statistics, or citations.
If the evidence is insufficient for a confident answer, say so clearly in the answer field.
Every factual claim must be supportable by the evidence IDs provided.
Only cite feedback IDs that appear in EVIDENCE.
Distinguish what customers said from patterns you observe.
Return ONLY a JSON object with this shape:

{
  "answer": string,
  "citations": [
    { "feedbackId": string, "reason": string }
  ]
}

Do not wrap the JSON in markdown fences.`;

export function buildAskLoopUserPrompt(params: {
  question: string;
  evidence: AskLoopEvidenceItem[];
}): string {
  const blocks = params.evidence.map((item, index) => {
    const themes =
      item.themes.length > 0 ? item.themes.join(", ") : "none";
    return `[Evidence ${index + 1}]
Feedback ID: ${item.feedbackId}
Channel: ${item.channel}
Date: ${item.createdAt.slice(0, 10)}
Sentiment: ${item.sentiment ?? "unknown"}
Themes: ${themes}
Content:
"""
${item.content.trim()}
"""`;
  });

  return `QUESTION:
${params.question.trim()}

EVIDENCE:
${blocks.join("\n\n")}

Use ONLY these evidence records. Cite only their Feedback IDs.`;
}
