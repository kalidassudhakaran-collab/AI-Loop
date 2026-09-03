/**
 * AI provider configuration for LOOP.
 *
 * Preference order for text generation:
 * 1. Anthropic Claude (brief default) when ANTHROPIC_API_KEY is set
 * 2. Google Gemini free tier when GEMINI_API_KEY is set
 *
 * ADD API: put keys only in .env (gitignored). Never hardcode keys.
 */

export const ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-4-6";
export const GEMINI_DEFAULT_MODEL = "gemini-2.0-flash";

export type AiTextProvider = "anthropic" | "gemini";

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/** True when at least one text LLM provider is available. */
export function isAiConfigured(): boolean {
  return isAnthropicConfigured() || isGeminiConfigured();
}

/**
 * Prefer Claude (brief), fall back to Gemini (free).
 */
export function getPreferredTextProvider(): AiTextProvider | null {
  if (isAnthropicConfigured()) return "anthropic";
  if (isGeminiConfigured()) return "gemini";
  return null;
}

export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. ADD API: paste the key into .env (never commit it).",
    );
  }
  return key;
}

export function getAnthropicModel(): string {
  const model = process.env.ANTHROPIC_MODEL?.trim();
  return model || ANTHROPIC_DEFAULT_MODEL;
}

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured. ADD API: paste the key into .env (never commit it).",
    );
  }
  return key;
}

export function getGeminiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim();
  return model || GEMINI_DEFAULT_MODEL;
}

export function getActiveTextModelLabel(): string {
  const provider = getPreferredTextProvider();
  if (provider === "anthropic") return getAnthropicModel();
  if (provider === "gemini") return getGeminiModel();
  return "none";
}
