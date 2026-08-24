/**
 * Ask LOOP configuration.
 * Cosine similarity = 1 - pgvector cosine distance (<=>).
 */
export const ASK_LOOP_RETRIEVAL_LIMIT = 10;
export const ASK_LOOP_EVIDENCE_LIMIT = 5;
/** Default minimum cosine similarity to accept evidence (0–1). */
export const ASK_LOOP_DEFAULT_MIN_SIMILARITY = 0.35;

export function getAskLoopMinSimilarity(): number {
  const raw = process.env.ASK_LOOP_MIN_SIMILARITY?.trim();
  if (!raw) {
    return ASK_LOOP_DEFAULT_MIN_SIMILARITY;
  }
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return ASK_LOOP_DEFAULT_MIN_SIMILARITY;
  }
  return value;
}

/** Convert pgvector cosine distance to similarity in [0, 1]. */
export function distanceToSimilarity(distance: number): number {
  const similarity = 1 - distance;
  if (!Number.isFinite(similarity)) {
    return 0;
  }
  return Math.min(1, Math.max(0, similarity));
}
