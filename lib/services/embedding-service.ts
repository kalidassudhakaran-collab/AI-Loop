import { Prisma } from "@prisma/client";
import { generateEmbedding, getEmbeddingProviderStatus } from "@/lib/ai/embeddings";
import { EmbeddingProviderError } from "@/lib/ai/embeddings/types";
import { prisma } from "@/lib/db";
import { AppError, NotFoundError } from "@/lib/errors";

export class VectorSupportError extends AppError {
  constructor(message: string) {
    super(message, 503);
    this.name = "VectorSupportError";
  }
}

function toVectorLiteral(vector: number[]): string {
  // pgvector text input format: [0.1,0.2,...]
  return `[${vector.map((value) => Number(value).toString()).join(",")}]`;
}

export async function isPgvectorAvailable(): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) AS "exists"
    `;
    return Boolean(rows[0]?.exists);
  } catch {
    return false;
  }
}

export async function embedAndStoreFeedback(
  workspaceId: string,
  feedbackId: string,
) {
  const status = getEmbeddingProviderStatus();
  if (!status.configured) {
    throw new EmbeddingProviderError(status.message);
  }

  if (!(await isPgvectorAvailable())) {
    throw new VectorSupportError(
      "pgvector extension is not available. Use the pgvector/pgvector:pg16 Docker image and run migrations.",
    );
  }

  const feedback = await prisma.feedback.findFirst({
    where: { id: feedbackId, workspaceId },
    select: { id: true, content: true },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found");
  }

  let generated;
  try {
    generated = await generateEmbedding(feedback.content);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Embedding generation failed";

    await prisma.embedding.upsert({
      where: { feedbackId },
      create: {
        feedbackId,
        status: "FAILED",
        error: message,
        provider: status.provider,
      },
      update: {
        status: "FAILED",
        error: message,
        provider: status.provider,
        updatedAt: new Date(),
      },
    });

    throw error;
  }

  const vectorLiteral = toVectorLiteral(generated.vector);

  await prisma.embedding.upsert({
    where: { feedbackId },
    create: {
      feedbackId,
      dimensions: generated.dimensions,
      provider: generated.provider,
      model: generated.model,
      status: "READY",
      error: null,
    },
    update: {
      dimensions: generated.dimensions,
      provider: generated.provider,
      model: generated.model,
      status: "READY",
      error: null,
      updatedAt: new Date(),
    },
  });

  await prisma.$executeRaw`
    UPDATE "Embedding"
    SET "vector" = ${vectorLiteral}::vector,
        "updatedAt" = NOW()
    WHERE "feedbackId" = ${feedbackId}
  `;

  return {
    feedbackId,
    status: "READY" as const,
    dimensions: generated.dimensions,
    provider: generated.provider,
    model: generated.model,
  };
}

export type BatchEmbedItemResult =
  | {
      feedbackId: string;
      ok: true;
      dimensions: number;
      provider: string;
      model: string;
    }
  | { feedbackId: string; ok: false; error: string };

export async function embedFeedbackBatch(
  workspaceId: string,
  feedbackIds: string[],
  concurrency = 2,
) {
  const uniqueIds = Array.from(new Set(feedbackIds));
  const results: BatchEmbedItemResult[] = [];
  let index = 0;

  async function worker() {
    while (index < uniqueIds.length) {
      const current = uniqueIds[index];
      index += 1;
      try {
        const saved = await embedAndStoreFeedback(workspaceId, current);
        results.push({
          feedbackId: current,
          ok: true,
          dimensions: saved.dimensions,
          provider: saved.provider,
          model: saved.model,
        });
      } catch (error) {
        results.push({
          feedbackId: current,
          ok: false,
          error: error instanceof Error ? error.message : "Embedding failed",
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, uniqueIds.length) }, () =>
      worker(),
    ),
  );

  const byId = new Map(results.map((item) => [item.feedbackId, item]));
  const ordered = uniqueIds.map(
    (id) =>
      byId.get(id) ?? {
        feedbackId: id,
        ok: false as const,
        error: "Embedding did not run",
      },
  );

  return {
    results: ordered,
    succeeded: ordered.filter((item) => item.ok).length,
    failed: ordered.filter((item) => !item.ok).length,
  };
}

export type SimilarFeedbackHit = {
  feedbackId: string;
  content: string;
  channel: string;
  sentiment: string | null;
  customerLabel: string | null;
  createdAt: Date;
  distance: number;
};

/**
 * Workspace-scoped semantic retrieval for M3-C Ask LOOP.
 * Requires pgvector + READY embeddings. Never fabricates scores.
 */
export async function searchSimilarFeedback(params: {
  workspaceId: string;
  queryEmbedding: number[];
  limit?: number;
}): Promise<SimilarFeedbackHit[]> {
  if (!(await isPgvectorAvailable())) {
    throw new VectorSupportError(
      "Semantic retrieval requires pgvector. Extension is not available.",
    );
  }

  if (!params.queryEmbedding.length) {
    throw new EmbeddingProviderError("queryEmbedding must not be empty");
  }

  const limit = Math.min(Math.max(params.limit ?? 8, 1), 50);
  const vectorLiteral = toVectorLiteral(params.queryEmbedding);

  const rows = await prisma.$queryRaw<
    Array<{
      feedbackId: string;
      content: string;
      channel: string;
      sentiment: string | null;
      customerLabel: string | null;
      createdAt: Date;
      distance: number;
    }>
  >(Prisma.sql`
    SELECT
      f."id" AS "feedbackId",
      f."content",
      f."channel",
      f."sentiment"::text AS "sentiment",
      f."customerLabel",
      f."createdAt",
      (e."vector" <=> ${vectorLiteral}::vector) AS "distance"
    FROM "Embedding" e
    INNER JOIN "Feedback" f ON f."id" = e."feedbackId"
    WHERE f."workspaceId" = ${params.workspaceId}
      AND e."status" = 'READY'
      AND e."vector" IS NOT NULL
    ORDER BY e."vector" <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `);

  return rows.map((row) => ({
    ...row,
    distance: Number(row.distance),
  }));
}

export async function getWorkspaceEmbeddingStats(workspaceId: string) {
  const [totalFeedback, ready, failed, pending] = await Promise.all([
    prisma.feedback.count({ where: { workspaceId } }),
    prisma.embedding.count({
      where: {
        status: "READY",
        feedback: { workspaceId },
      },
    }),
    prisma.embedding.count({
      where: {
        status: "FAILED",
        feedback: { workspaceId },
      },
    }),
    prisma.embedding.count({
      where: {
        status: "PENDING",
        feedback: { workspaceId },
      },
    }),
  ]);

  return {
    totalFeedback,
    ready,
    failed,
    pending,
    notEmbedded: Math.max(totalFeedback - ready - failed - pending, 0),
    provider: getEmbeddingProviderStatus(),
    pgvector: await isPgvectorAvailable(),
  };
}
