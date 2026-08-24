import { OllamaEmbeddingProvider } from "@/lib/ai/embeddings/ollama-provider";
import {
  EmbeddingProviderError,
  type EmbeddingGenerationResult,
  type EmbeddingProvider,
} from "@/lib/ai/embeddings/types";

/**
 * Resolve the active embedding provider.
 * Default: none configured (never invents fake vectors).
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
} {
  const selected = process.env.EMBEDDING_PROVIDER?.trim().toLowerCase() || null;

  if (!selected || selected === "none" || selected === "off") {
    return {
      configured: false,
      provider: null,
      message:
        "Embedding provider not configured. Set EMBEDDING_PROVIDER=ollama and pull an embedding model to enable semantic retrieval.",
    };
  }

  const provider = getEmbeddingProvider();
  if (!provider) {
    return {
      configured: false,
      provider: selected,
      message: `Unknown or unavailable embedding provider "${selected}". Supported: ollama.`,
    };
  }

  return {
    configured: true,
    provider: provider.id,
    message: `Embedding provider ready: ${provider.id}`,
  };
}

export async function generateEmbedding(
  text: string,
): Promise<EmbeddingGenerationResult> {
  const provider = getEmbeddingProvider();
  if (!provider) {
    throw new EmbeddingProviderError(
      getEmbeddingProviderStatus().message,
    );
  }
  return provider.generateEmbedding(text);
}
