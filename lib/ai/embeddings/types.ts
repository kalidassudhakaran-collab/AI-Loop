import { AppError } from "@/lib/errors";

export type EmbeddingVector = number[];

export type EmbeddingGenerationResult = {
  vector: EmbeddingVector;
  dimensions: number;
  provider: string;
  model: string;
};

export interface EmbeddingProvider {
  readonly id: string;
  isConfigured(): boolean;
  generateEmbedding(text: string): Promise<EmbeddingGenerationResult>;
}

export class EmbeddingProviderError extends AppError {
  constructor(message: string, statusCode = 503) {
    super(message, statusCode);
    this.name = "EmbeddingProviderError";
  }
}
