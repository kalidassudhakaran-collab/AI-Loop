/**
 * Central Anthropic configuration for LOOP.
 * Model defaults to the Project LOOP brief: claude-sonnet-4-6
 */
export const ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-4-6";

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to your .env file.",
    );
  }
  return key;
}

export function getAnthropicModel(): string {
  const model = process.env.ANTHROPIC_MODEL?.trim();
  return model || ANTHROPIC_DEFAULT_MODEL;
}
