import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { classifyFeedbackContent } from "@/lib/services/ai/classification-service";
import type { ClassificationResult } from "@/lib/validation/classification";

const THEME_COLORS = [
  "#6366f1",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#0ea5e9",
  "#14b8a6",
  "#f97316",
];

export type SavedClassification = {
  feedbackId: string;
  sentiment: ClassificationResult["sentiment"];
  sentimentScore: number;
  featureArea: string;
  confidence: number;
  classifiedAt: Date;
  themes: Array<{
    name: string;
    confidence: number;
  }>;
};

/**
 * Classify one feedback item that belongs to the given workspace.
 * Tenant isolation: lookup requires both feedbackId and workspaceId.
 */
export async function classifyAndSaveFeedback(
  workspaceId: string,
  feedbackId: string,
): Promise<SavedClassification> {
  const feedback = await prisma.feedback.findFirst({
    where: {
      id: feedbackId,
      workspaceId,
    },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found");
  }

  const classification = await classifyFeedbackContent(feedback.content);

  const saved = await prisma.$transaction(async (tx) => {
    // Replace previous theme links for this feedback.
    await tx.feedbackTheme.deleteMany({
      where: { feedbackId },
    });

    const themeLinks: Array<{ name: string; confidence: number }> = [];

    for (const themeInput of classification.themes) {
      let theme = await tx.theme.findUnique({
        where: {
          workspaceId_name: {
            workspaceId,
            name: themeInput.name,
          },
        },
      });

      if (!theme) {
        const color =
          THEME_COLORS[
            Math.abs(hashString(themeInput.name)) % THEME_COLORS.length
          ];
        theme = await tx.theme.create({
          data: {
            name: themeInput.name,
            description: `Auto-created from AI classification`,
            color,
            workspaceId,
          },
        });
      }

      await tx.feedbackTheme.create({
        data: {
          feedbackId,
          themeId: theme.id,
          confidence: themeInput.confidence,
        },
      });

      themeLinks.push({
        name: theme.name,
        confidence: themeInput.confidence,
      });
    }

    const updated = await tx.feedback.update({
      where: { id: feedbackId },
      data: {
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        featureArea: classification.featureArea,
        classificationConfidence: classification.confidence,
        classifiedAt: new Date(),
      },
    });

    return {
      feedbackId: updated.id,
      sentiment: classification.sentiment,
      sentimentScore: classification.sentimentScore,
      featureArea: classification.featureArea,
      confidence: classification.confidence,
      classifiedAt: updated.classifiedAt!,
      themes: themeLinks,
    };
  });

  return saved;
}

export type BatchClassifyItemResult =
  | { feedbackId: string; ok: true; classification: SavedClassification }
  | { feedbackId: string; ok: false; error: string };

/**
 * Classify multiple workspace-scoped feedback IDs with limited concurrency.
 */
export async function classifyFeedbackBatch(
  workspaceId: string,
  feedbackIds: string[],
  concurrency = 2,
): Promise<{
  results: BatchClassifyItemResult[];
  succeeded: number;
  failed: number;
}> {
  const uniqueIds = Array.from(new Set(feedbackIds));
  const results: BatchClassifyItemResult[] = [];

  let index = 0;

  async function worker() {
    while (index < uniqueIds.length) {
      const current = uniqueIds[index];
      index += 1;

      try {
        const classification = await classifyAndSaveFeedback(
          workspaceId,
          current,
        );
        results.push({
          feedbackId: current,
          ok: true,
          classification,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Classification failed";
        results.push({
          feedbackId: current,
          ok: false,
          error: message,
        });
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, uniqueIds.length) },
    () => worker(),
  );
  await Promise.all(workers);

  // Keep results in request order.
  const byId = new Map(results.map((item) => [item.feedbackId, item]));
  const ordered = uniqueIds.map(
    (id) =>
      byId.get(id) ?? {
        feedbackId: id,
        ok: false as const,
        error: "Classification did not run",
      },
  );

  return {
    results: ordered,
    succeeded: ordered.filter((item) => item.ok).length,
    failed: ordered.filter((item) => !item.ok).length,
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
