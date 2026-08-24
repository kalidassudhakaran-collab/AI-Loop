import {
  EmbeddingProviderError,
  type EmbeddingGenerationResult,
  type EmbeddingProvider,
} from "@/lib/ai/embeddings/types";

/**
 * Optional Ollama embedding provider.
 * Does NOT download models automatically.
 * Requires a running Ollama with an embedding model already pulled.
 *
 * Example:
 *   ollama pull nomic-embed-text
 *   EMBEDDING_PROVIDER=ollama
 *   EMBEDDING_MODEL=nomic-embed-text
 *   EMBEDDING_BASE_URL=http://127.0.0.1:11434
 */
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly id = "ollama";

  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = (
      process.env.EMBEDDING_BASE_URL?.trim() || "http://127.0.0.1:11434"
    ).replace(/\/$/, "");
    this.model =
      process.env.EMBEDDING_MODEL?.trim() || "nomic-embed-text";
  }

  isConfigured(): boolean {
    return process.env.EMBEDDING_PROVIDER?.trim().toLowerCase() === "ollama";
  }

  async generateEmbedding(text: string): Promise<EmbeddingGenerationResult> {
    if (!this.isConfigured()) {
      throw new EmbeddingProviderError(
        "Ollama embedding provider is not enabled. Set EMBEDDING_PROVIDER=ollama.",
      );
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new EmbeddingProviderError("Cannot embed empty text");
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt: trimmed,
        }),
      });
    } catch {
      throw new EmbeddingProviderError(
        `Cannot reach Ollama at ${this.baseUrl}. Is Ollama running?`,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new EmbeddingProviderError(
        `Ollama embedding request failed (${response.status}). Ensure model "${this.model}" is pulled. ${body.slice(0, 200)}`,
      );
    }

    const data = (await response.json()) as { embedding?: number[] };
    if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
      throw new EmbeddingProviderError(
        "Ollama returned an empty embedding. Use a dedicated embedding model (e.g. nomic-embed-text).",
      );
    }

    if (!data.embedding.every((value) => typeof value === "number")) {
      throw new EmbeddingProviderError("Ollama returned a non-numeric embedding");
    }

    return {
      vector: data.embedding,
      dimensions: data.embedding.length,
      provider: this.id,
      model: this.model,
    };
  }
}
