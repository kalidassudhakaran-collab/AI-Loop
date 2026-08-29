import { OllamaEmbeddingProvider } from "@/lib/ai/embeddings/ollama-provider";
import { getExpectedEmbeddingDimensions } from "@/lib/ai/embeddings/config";
import {
  EmbeddingProviderError,
  type EmbeddingGenerationResult,
  type EmbeddingProvider,
} from "@/lib/ai/embeddings/types";

/**
 * Resolve the active embedding provider.
 * Default: none configured (never invents fake vectors).
 * ADD API is not required here — optional local Ollama via EMBEDDING_PROVIDER=ollama.
 */
export function getEmbeddingProvider(): EmbeddingProvider | null {
  const selected = process.env.EMBEDDING_PROVIDER?.trim().toLowerCase();

  if (!selected || selected === "none" || selected === "off") {
    return null;
  }

  if (selected === "ollama") {
    const provider = new OllamaEmbeddingProvider();
    return provider.isConfigured() ? provider : null;
  }

  return null;
}

export function getEmbeddingProviderStatus(): {
  configured: boolean;
  provider: string | null;
  message: string;
  expectedDimensions: number;
} {
  const expectedDimensions = getExpectedEmbeddingDimensions();
  const selected = process.env.EMBEDDING_PROVIDER?.trim().toLowerCase() || null;

  if (!selected || selected === "none" || selected === "off") {
    return {
      configured: false,
      provider: null,
      expectedDimensions,
      message:
        "Embedding provider not configured. Set EMBEDDING_PROVIDER=ollama and pull nomic-embed-text (768-d) to enable semantic retrieval.",
    };
  }

  const provider = getEmbeddingProvider();
  if (!provider) {
    return {
      configured: false,
      provider: selected,
      expectedDimensions,
      message: `Unknown or unavailable embedding provider "${selected}". Supported: ollama.`,
    };
  }

  return {
    configured: true,
    provider: provider.id,
    expectedDimensions,
    message: `Embedding provider ready: ${provider.id} (expects ${expectedDimensions}-d vectors)`,
  };
}

export async function generateEmbedding(
  text: string,
): Promise<EmbeddingGenerationResult> {
  const provider = getEmbeddingProvider();
  if (!provider) {
    throw new EmbeddingProviderError(getEmbeddingProviderStatus().message);
  }

  const result = await provider.generateEmbedding(text);
  const expected = getExpectedEmbeddingDimensions();

  if (result.dimensions !== expected) {
    throw new EmbeddingProviderError(
      `Embedding dimension mismatch: got ${result.dimensions}, expected ${expected} (nomic-embed-text / vector(${expected})).`,
    );
  }

  return result;
}
