import { isAnthropicConfigured } from "@/lib/ai/config";
import { classifyAndSaveFeedback, classifyFeedbackBatch } from "@/lib/services/ai/classify-and-save";

const BULK_CLASSIFY_LIMIT = 20;

/**
 * Classify a single newly created item. Failures never block ingestion.
 */
export async function classifyOnIngest(
  workspaceId: string,
  feedbackId: string,
): Promise<{ classified: boolean; error?: string }> {
  if (!isAnthropicConfigured()) {
    return { classified: false, error: "ANTHROPIC_API_KEY is not configured. ADD API in .env." };
  }

  try {
    await classifyAndSaveFeedback(workspaceId, feedbackId);
    return { classified: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Classification failed";
    console.error("Classify-on-ingest failed:", message);
    return { classified: false, error: message };
  }
}

/**
 * Queue classification for bulk ingest without blocking the HTTP response.
 * Caps volume so CSV uploads stay economical.
 */
export function queueClassificationOnIngest(
  workspaceId: string,
  feedbackIds: string[],
): { queued: number; skipped: number } {
  const unique = Array.from(new Set(feedbackIds));
  if (!isAnthropicConfigured() || unique.length === 0) {
    return { queued: 0, skipped: unique.length };
  }

  const queued = unique.slice(0, BULK_CLASSIFY_LIMIT);
  const skipped = unique.length - queued.length;

  void classifyFeedbackBatch(workspaceId, queued, 2).catch((error) => {
    console.error(
      "Background classification queue failed:",
      error instanceof Error ? error.message : error,
    );
  });

  return { queued: queued.length, skipped };
}
