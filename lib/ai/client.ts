import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey, getAnthropicModel } from "@/lib/ai/config";
import { AppError } from "@/lib/errors";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: getAnthropicApiKey(),
    });
  }
  return client;
}

export class AiServiceError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode);
    this.name = "AiServiceError";
  }
}

/**
 * Low-level Claude text completion. Does not write to the database.
 */
export async function completeClaudeText(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  try {
    const response = await getClient().messages.create({
      model: getAnthropicModel(),
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

    return text;
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("api key") ||
        message.includes("authentication") ||
        message.includes("unauthorized")
      ) {
        throw new AiServiceError(
          "Anthropic API authentication failed. ADD API: check ANTHROPIC_API_KEY in .env.",
          502,
        );
      }

      if (message.includes("rate") || message.includes("429")) {
        throw new AiServiceError(
          "Anthropic rate limit reached. Please wait and try again.",
          429,
        );
      }

      if (message.includes("timeout") || message.includes("timed out")) {
        throw new AiServiceError(
          "Anthropic request timed out. Please try again.",
          504,
        );
      }

      // Never log the raw API key; message from SDK should be safe.
      console.error("Anthropic API error:", error.message);
    } else {
      console.error("Anthropic API error: unknown failure");
    }

    throw new AiServiceError(
      "Unable to complete the AI request. Please try again.",
      502,
    );
  }
}
