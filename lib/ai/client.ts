import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getAnthropicApiKey,
  getAnthropicModel,
  getGeminiApiKey,
  getGeminiModel,
  getPreferredTextProvider,
  isAnthropicConfigured,
  isGeminiConfigured,
  type AiTextProvider,
} from "@/lib/ai/config";
import { AppError } from "@/lib/errors";

let anthropicClient: Anthropic | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: getAnthropicApiKey(),
    });
  }
  return anthropicClient;
}

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(getGeminiApiKey());
  }
  return geminiClient;
}

export class AiServiceError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode);
    this.name = "AiServiceError";
  }
}

export type AiCompletionResult = {
  text: string;
  provider: AiTextProvider;
  model: string;
};

function mapProviderError(provider: AiTextProvider, error: unknown): never {
  if (error instanceof AiServiceError) {
    throw error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const label = provider === "anthropic" ? "Anthropic" : "Gemini";

    if (
      message.includes("api key") ||
      message.includes("api_key") ||
      message.includes("authentication") ||
      message.includes("unauthorized") ||
      message.includes("permission denied") ||
      message.includes("invalid x-goog-api-key")
    ) {
      throw new AiServiceError(
        `${label} authentication failed. ADD API: check ${
          provider === "anthropic" ? "ANTHROPIC_API_KEY" : "GEMINI_API_KEY"
        } in .env.`,
        502,
      );
    }

    if (
      message.includes("rate") ||
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("resource_exhausted")
    ) {
      throw new AiServiceError(
        `${label} rate limit or free-tier quota reached. Wait and try again.`,
        429,
      );
    }

    if (message.includes("timeout") || message.includes("timed out")) {
      throw new AiServiceError(
        `${label} request timed out. Please try again.`,
        504,
      );
    }

    console.error(`${label} API error:`, error.message);
  } else {
    console.error("AI provider error: unknown failure");
  }

  throw new AiServiceError(
    "Unable to complete the AI request. Please try again.",
    502,
  );
}

async function completeWithAnthropic(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<AiCompletionResult> {
  try {
    const model = getAnthropicModel();
    const response = await getAnthropicClient().messages.create({
      model,
      max_tokens: params.maxTokens ?? 800,
      system: params.system,
      messages: [
        {
          role: "user",
          content: params.user,
        },
      ],
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );

    const text = textBlocks.map((block) => block.text).join("\n").trim();
    if (!text) {
      throw new AiServiceError("Claude returned an empty response");
    }

    return { text, provider: "anthropic", model };
  } catch (error) {
    mapProviderError("anthropic", error);
  }
}

async function completeWithGemini(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<AiCompletionResult> {
  try {
    const modelName = getGeminiModel();
    const model = getGeminiClient().getGenerativeModel({
      model: modelName,
      systemInstruction: params.system,
      generationConfig: {
        maxOutputTokens: params.maxTokens ?? 800,
        temperature: 0.2,
      },
    });

    const response = await model.generateContent(params.user);
    const text = response.response.text()?.trim() ?? "";
    if (!text) {
      throw new AiServiceError("Gemini returned an empty response");
    }

    return { text, provider: "gemini", model: modelName };
  } catch (error) {
    mapProviderError("gemini", error);
  }
}

/**
 * Complete text with the preferred provider (Claude → Gemini fallback).
 */
export async function completeAiText(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<AiCompletionResult> {
  const preferred = getPreferredTextProvider();

  if (!preferred) {
    throw new AiServiceError(
      "No AI provider configured. ADD API: set GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in .env.",
      503,
    );
  }

  if (preferred === "anthropic") {
    try {
      return await completeWithAnthropic(params);
    } catch (error) {
      // If Claude fails and Gemini is available, fall through for demos.
      if (!isGeminiConfigured()) {
        throw error;
      }
      console.error(
        "Claude failed; falling back to Gemini:",
        error instanceof Error ? error.message : error,
      );
      return completeWithGemini(params);
    }
  }

  return completeWithGemini(params);
}

/**
 * Back-compat alias used by older call sites.
 * Prefer completeAiText for new code.
 */
export async function completeClaudeText(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const result = await completeAiText(params);
  return result.text;
}

export function describeAiAvailability(): {
  configured: boolean;
  provider: AiTextProvider | null;
  anthropic: boolean;
  gemini: boolean;
} {
  return {
    configured: isAnthropicConfigured() || isGeminiConfigured(),
    provider: getPreferredTextProvider(),
    anthropic: isAnthropicConfigured(),
    gemini: isGeminiConfigured(),
  };
}
