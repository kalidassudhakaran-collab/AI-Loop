import {
  generateEmbedding,
  getEmbeddingProviderStatus,
} from "@/lib/ai/embeddings";
import { isAnthropicConfigured } from "@/lib/ai/config";
import { prisma } from "@/lib/db";
import { EmbeddingProviderError } from "@/lib/ai/embeddings/types";
import { VectorSupportError } from "@/lib/services/embedding-service";
import { generateGroundedAskLoopAnswer } from "@/lib/services/ask-loop/answer";
import { retrieveAskLoopEvidence } from "@/lib/services/ask-loop/retrieve";
import type { AskLoopStatus } from "@/lib/validation/ask-loop";
import type { AskLoopEvidenceItem } from "@/lib/services/ask-loop/retrieve";

export type AskLoopResponse = {
  status: AskLoopStatus;
  message: string;
  answer: string | null;
  citations: Array<{
    feedbackId: string;
    contentPreview: string;
    similarity: number;
    channel: string;
    sentiment: string | null;
    reason?: string;
  }>;
  debug?: {
    retrievedCount: number;
    evidenceCount: number;
    bestSimilarity: number | null;
    minSimilarity: number;
    evidenceIds: string[];
    embeddingProvider: string | null;
    anthropicConfigured: boolean;
  };
};

function citationPayload(
  evidence: AskLoopEvidenceItem[],
  reasons: Map<string, string | undefined>,
) {
  return evidence.map((item) => ({
    feedbackId: item.feedbackId,
    contentPreview: item.contentPreview,
    similarity: Number(item.similarity.toFixed(4)),
    channel: item.channel,
    sentiment: item.sentiment,
    reason: reasons.get(item.feedbackId),
  }));
}

/**
 * Full Ask LOOP pipeline — workspace-scoped, no fake embeddings or answers.
 */
export async function askLoop(params: {
  workspaceId: string;
  question: string;
  includeDebug?: boolean;
}): Promise<AskLoopResponse> {
  const question = params.question.trim();
  const anthropicConfigured = isAnthropicConfigured();
  const embeddingStatus = getEmbeddingProviderStatus();

  const withDebug = (
    response: Omit<AskLoopResponse, "debug">,
    extra?: Partial<AskLoopResponse["debug"]>,
  ): AskLoopResponse => {
    if (!params.includeDebug) {
      return response;
    }
    return {
      ...response,
      debug: {
        retrievedCount: 0,
        evidenceCount: 0,
        bestSimilarity: null,
        minSimilarity: 0,
        evidenceIds: [],
        embeddingProvider: embeddingStatus.provider,
        anthropicConfigured,
        ...extra,
      },
    };
  };

  if (!embeddingStatus.configured) {
    return withDebug({
      status: "EMBEDDING_PROVIDER_UNAVAILABLE",
      message:
        "Semantic search is not configured yet. Set EMBEDDING_PROVIDER=ollama and pull nomic-embed-text.",
      answer: null,
      citations: [],
    });
  }

  const readyCount = await prisma.embedding.count({
    where: {
      status: "READY",
      feedback: { workspaceId: params.workspaceId },
    },
  });

  if (readyCount === 0) {
    return withDebug({
      status: "NO_EMBEDDINGS",
      message:
        "Semantic search is not configured yet. Generate embeddings before using Ask LOOP.",
      answer: null,
      citations: [],
    });
  }

  let queryEmbedding: number[];
  try {
    const generated = await generateEmbedding(question);
    queryEmbedding = generated.vector;
  } catch (error) {
    if (
      error instanceof EmbeddingProviderError ||
      error instanceof VectorSupportError
    ) {
      return withDebug({
        status: "EMBEDDING_PROVIDER_UNAVAILABLE",
        message: error.message,
        answer: null,
        citations: [],
      });
    }
    throw error;
  }

  const retrieval = await retrieveAskLoopEvidence({
    workspaceId: params.workspaceId,
    queryEmbedding,
  });

  if (retrieval.evidence.length === 0) {
    return withDebug(
      {
        status: "INSUFFICIENT_EVIDENCE",
        message:
          "I don't have enough relevant feedback evidence to answer that confidently.",
        answer: null,
        citations: [],
      },
      {
        retrievedCount: retrieval.retrieved.length,
        evidenceCount: 0,
        bestSimilarity: retrieval.bestSimilarity,
        minSimilarity: retrieval.minSimilarity,
        evidenceIds: [],
      },
    );
  }

  if (!anthropicConfigured) {
    return withDebug(
      {
        status: "AI_PROVIDER_UNAVAILABLE",
        message:
          "AI answer generation is not configured yet. Evidence was retrieved successfully — set ANTHROPIC_API_KEY to generate grounded answers.",
        answer: null,
        citations: citationPayload(retrieval.evidence, new Map()),
      },
      {
        retrievedCount: retrieval.retrieved.length,
        evidenceCount: retrieval.evidence.length,
        bestSimilarity: retrieval.bestSimilarity,
        minSimilarity: retrieval.minSimilarity,
        evidenceIds: retrieval.evidence.map((item) => item.feedbackId),
      },
    );
  }

  try {
    const generated = await generateGroundedAskLoopAnswer({
      question,
      evidence: retrieval.evidence,
    });

    const reasons = new Map(
      generated.citations.map((citation) => [
        citation.feedbackId,
        citation.reason,
      ]),
    );

    // Only surface citations that exist in selected evidence (already validated).
    const citedEvidence = retrieval.evidence.filter((item) =>
      reasons.has(item.feedbackId),
    );
    const citations =
      citedEvidence.length > 0
        ? citationPayload(citedEvidence, reasons)
        : citationPayload(retrieval.evidence, reasons);

    return withDebug(
      {
        status: "ANSWERED",
        message: "Answer grounded in retrieved workspace feedback.",
        answer: generated.answer,
        citations,
      },
      {
        retrievedCount: retrieval.retrieved.length,
        evidenceCount: retrieval.evidence.length,
        bestSimilarity: retrieval.bestSimilarity,
        minSimilarity: retrieval.minSimilarity,
        evidenceIds: retrieval.evidence.map((item) => item.feedbackId),
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate a grounded answer.";

    return withDebug(
      {
        status: "ERROR",
        message,
        answer: null,
        citations: citationPayload(retrieval.evidence, new Map()),
      },
      {
        retrievedCount: retrieval.retrieved.length,
        evidenceCount: retrieval.evidence.length,
        bestSimilarity: retrieval.bestSimilarity,
        minSimilarity: retrieval.minSimilarity,
        evidenceIds: retrieval.evidence.map((item) => item.feedbackId),
      },
    );
  }
}
