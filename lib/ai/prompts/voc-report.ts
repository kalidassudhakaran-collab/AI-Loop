import type { VocReportStats } from "@/lib/validation/reports";

export const VOC_REPORT_SYSTEM_PROMPT = `You are a product insights writer for LOOP, a Voice-of-Customer platform.

Write a leadership-ready weekly digest from the STATS JSON the user provides.
Use only those numbers, theme names, and quote IDs. Never invent counts, percentages, customers, or feedback.

Return ONLY a single JSON object with this shape:

{
  "title": string,
  "executiveSummary": string,
  "themeInsights": string[],
  "sentimentNarrative": string,
  "recommendedActions": [{ "title": string, "rationale": string, "priority": "high" | "medium" | "low" }],
  "highlightedQuotes": [{ "feedbackId": string, "whyItMatters": string }]
}

Rules:
- executiveSummary: 2-4 sentences a Head of Product could read in 20 seconds
- themeInsights: one short paragraph per notable theme, citing the provided counts and change
- recommendedActions: concrete next steps grounded in the stats (3-5 items)
- highlightedQuotes: only use feedbackId values that appear in stats.quotes
- Do not include markdown, code fences, or commentary outside JSON
- If volume is zero, say so plainly and keep actions about collecting more feedback`;

export function buildVocReportUserPrompt(stats: VocReportStats): string {
  return `Write a Voice-of-Customer report from these pre-computed workspace stats.

STATS:
${JSON.stringify(stats, null, 2)}

Remember: every figure and every quote ID must come from STATS.`;
}
