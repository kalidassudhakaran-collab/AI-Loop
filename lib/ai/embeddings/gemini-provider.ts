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

/**
 * Current Gemini embedding model (text-embedding-004 was shut down Jan 2026).
 * Supports Matryoshka output sizes including 768 — matches pgvector column.
 * @see https://ai.google.dev/gemini-api/docs/embeddings
 */
export const GEMINI_EMBEDDING_DEFAULT_MODEL = "gemini-embedding-001";

/**
 * Free-tier Gemini embeddings for Ask LOOP.
 *
 * Enable with:
 *   GEMINI_API_KEY=...
 *   EMBEDDING_PROVIDER=gemini
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly id = "gemini";

  isConfigured(): boolean {
    return (
      isGeminiConfigured() &&
      process.env.EMBEDDING_PROVIDER?.trim().toLowerCase() === "gemini"
    );
  }

  private getModel(): string {
    const configured = process.env.EMBEDDING_MODEL?.trim();
    // Old default was retired — remap silently so existing .env keeps working.
    if (!configured || configured === "text-embedding-004") {
      return GEMINI_EMBEDDING_DEFAULT_MODEL;
    }
    return configured;
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
    const apiKey = getGeminiApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:embedContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${modelName}`,
          content: {
            parts: [{ text: trimmed }],
          },
          // Request 768-d to match Embedding.vector(768) / HNSW index
          outputDimensionality: expected,
        }),
      });

      const payload = (await response.json()) as {
        error?: { message?: string };
        embedding?: { values?: number[] };
      };

      if (!response.ok) {
        throw new EmbeddingProviderError(
          payload.error?.message ??
            `Gemini embedding HTTP ${response.status}`,
        );
      }

      const values = payload.embedding?.values ?? [];
      if (!values.length) {
        throw new EmbeddingProviderError("Gemini returned an empty embedding");
      }

      if (values.length !== expected) {
        throw new EmbeddingProviderError(
          `Gemini embedding dimension mismatch: got ${values.length}, expected ${expected}.`,
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
