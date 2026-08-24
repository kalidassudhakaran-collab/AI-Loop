/**
 * LOOP embedding configuration.
 * Default model: nomic-embed-text → 768 dimensions (fixed for pgvector HNSW).
 */
export const EMBEDDING_DEFAULT_MODEL = "nomic-embed-text";

/** Fixed vector dimension required by the Embedding.vector(768) column. */
export const EMBEDDING_DIMENSIONS = 768;

export function getExpectedEmbeddingDimensions(): number {
  const raw = process.env.EMBEDDING_DIMENSIONS?.trim();
  if (!raw) {
    return EMBEDDING_DIMENSIONS;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : EMBEDDING_DIMENSIONS;
}
