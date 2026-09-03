import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getExpectedEmbeddingDimensions,
  EMBEDDING_DIMENSIONS,
} from "@/lib/ai/embeddings/config";
import {
  EmbeddingProviderError,
  type EmbeddingGenerationResult,
  type EmbeddingProvider,
} from "@/lib/ai/embeddings/types";
import { getGeminiApiKey, isGeminiConfigured } from "@/lib/ai/config";

/** Gemini text-embedding-004 defaults to 768-d — matches pgvector column. */
export const GEMINI_EMBEDDING_DEFAULT_MODEL = "text-embedding-004";

/**
 * Free-tier Gemini embeddings for Ask LOOP.
 *
 * Enable with:
 *   GEMINI_API_KEY=...
 *   EMBEDDING_PROVIDER=gemini
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly id = "gemini";

  private client: GoogleGenerativeAI | null = null;

  isConfigured(): boolean {
    return (
      isGeminiConfigured() &&
      process.env.EMBEDDING_PROVIDER?.trim().toLowerCase() === "gemini"
    );
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      this.client = new GoogleGenerativeAI(getGeminiApiKey());
    }
    return this.client;
  }

  private getModel(): string {
    return (
      process.env.EMBEDDING_MODEL?.trim() || GEMINI_EMBEDDING_DEFAULT_MODEL
    );
  }

  async generateEmbedding(text: string): Promise<EmbeddingGenerationResult> {
    if (!this.isConfigured()) {
      throw new EmbeddingProviderError(
        "Gemini embedding provider is not enabled. Set EMBEDDING_PROVIDER=gemini and GEMINI_API_KEY.",
      );
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new EmbeddingProviderError("Cannot embed empty text");
    }

    const expected = getExpectedEmbeddingDimensions() || EMBEDDING_DIMENSIONS;
    const modelName = this.getModel();

    try {
      const model = this.getClient().getGenerativeModel({ model: modelName });
      // SDK typings vary by version; use embedContent with plain text.
      const result = await model.embedContent(trimmed);
      let values = result.embedding?.values ?? [];

      // If the API returns a larger vector, truncate/pad is unsafe — require match.
      if (values.length !== expected) {
        // Retry with explicit task type via request object when supported.
        const retry = await model.embedContent({
          content: { role: "user", parts: [{ text: trimmed }] },
        });
        values = retry.embedding?.values ?? [];
      }

      if (!values.length) {
        throw new EmbeddingProviderError("Gemini returned an empty embedding");
      }

      if (values.length !== expected) {
        throw new EmbeddingProviderError(
          `Gemini embedding dimension mismatch: got ${values.length}, expected ${expected}. Set EMBEDDING_DIMENSIONS or use text-embedding-004.`,
        );
      }

      return {
        vector: Array.from(values),
        dimensions: values.length,
        provider: this.id,
        model: modelName,
      };
    } catch (error) {
      if (error instanceof EmbeddingProviderError) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Gemini embedding failed";
      throw new EmbeddingProviderError(`Gemini embedding error: ${message}`);
    }
  }
}
