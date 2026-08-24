import { prisma } from "@/lib/db";
import {
  ASK_LOOP_EVIDENCE_LIMIT,
  ASK_LOOP_RETRIEVAL_LIMIT,
  distanceToSimilarity,
  getAskLoopMinSimilarity,
} from "@/lib/services/ask-loop/config";
import {
  searchSimilarFeedback,
  type SimilarFeedbackHit,
} from "@/lib/services/embedding-service";

export type AskLoopEvidenceItem = {
  feedbackId: string;
  content: string;
  contentPreview: string;
  channel: string;
  sentiment: string | null;
  sentimentScore: number | null;
  customerLabel: string | null;
  createdAt: string;
  similarity: number;
  themes: string[];
};

function preview(content: string, max = 180): string {
  const trimmed = content.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

async function attachThemes(
  workspaceId: string,
  hits: SimilarFeedbackHit[],
): Promise<AskLoopEvidenceItem[]> {
  const ids = hits.map((hit) => hit.feedbackId);
  if (ids.length === 0) {
    return [];
  }

  const links = await prisma.feedbackTheme.findMany({
    where: {
      feedbackId: { in: ids },
      theme: { workspaceId },
    },
    select: {
      feedbackId: true,
      theme: { select: { name: true } },
    },
  });

  const themesByFeedback = new Map<string, string[]>();
  for (const link of links) {
    const list = themesByFeedback.get(link.feedbackId) ?? [];
    list.push(link.theme.name);
    themesByFeedback.set(link.feedbackId, list);
  }

  return hits.map((hit) => ({
    feedbackId: hit.feedbackId,
    content: hit.content,
    contentPreview: preview(hit.content),
    channel: hit.channel,
    sentiment: hit.sentiment,
    sentimentScore: hit.sentimentScore,
    customerLabel: hit.customerLabel,
    createdAt: hit.createdAt.toISOString(),
    similarity: distanceToSimilarity(hit.distance),
    themes: themesByFeedback.get(hit.feedbackId) ?? [],
  }));
}

/**
 * Retrieve and select workspace-scoped evidence for Ask LOOP.
 * Never invents similarity scores or feedback rows.
 */
export async function retrieveAskLoopEvidence(params: {
  workspaceId: string;
  queryEmbedding: number[];
}): Promise<{
  retrieved: AskLoopEvidenceItem[];
  evidence: AskLoopEvidenceItem[];
  bestSimilarity: number | null;
  minSimilarity: number;
}> {
  const minSimilarity = getAskLoopMinSimilarity();

  const hits = await searchSimilarFeedback({
    workspaceId: params.workspaceId,
    queryEmbedding: params.queryEmbedding,
    limit: ASK_LOOP_RETRIEVAL_LIMIT,
  });

  const retrieved = await attachThemes(params.workspaceId, hits);
  const evidence = retrieved
    .filter((item) => item.similarity >= minSimilarity)
    .slice(0, ASK_LOOP_EVIDENCE_LIMIT);

  const bestSimilarity =
    retrieved.length > 0
      ? Math.max(...retrieved.map((item) => item.similarity))
      : null;

  return {
    retrieved,
    evidence,
    bestSimilarity,
    minSimilarity,
  };
}
