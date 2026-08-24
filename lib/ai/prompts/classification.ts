export const CLASSIFICATION_SYSTEM_PROMPT = `You are a customer-feedback classifier for LOOP, a B2B product analytics platform.

Classify ONLY from the feedback text provided by the user.
Do not invent facts that are not supported by the text.
Do not include explanations, markdown, or code fences.
Return ONLY a single JSON object matching this shape exactly:

{
  "sentiment": "POS" | "NEU" | "NEG",
  "sentimentScore": number between -1 and 1,
  "themes": [{ "name": string, "confidence": number between 0 and 1 }],
  "featureArea": string,
  "confidence": number between 0 and 1
}

Rules:
- sentiment POS = positive, NEU = neutral/mixed, NEG = negative
- sentimentScore: -1 strongly negative, 0 neutral, +1 strongly positive
- themes: 1 to 5 meaningful product themes (e.g. Onboarding, Billing, Performance, Mobile, Authentication, Dashboard, Reporting, Search, Notifications, Integrations)
- featureArea: one concise product area (e.g. Login, Checkout, Dashboard, Mobile App)
- confidence: overall classification confidence from 0 to 1
- Prefer concise Title Case theme and feature area names`;

export function buildClassificationUserPrompt(content: string): string {
  return `Classify this customer feedback:

"""
${content.trim()}
"""`;
}

/**
 * Strip markdown fences if the model ignores "JSON only" instructions.
 */
export function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}
