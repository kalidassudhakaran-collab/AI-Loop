"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type EmbeddingPanelProps = {
  canEmbed: boolean;
  stats: {
    totalFeedback: number;
    ready: number;
    failed: number;
    pending: number;
    notEmbedded: number;
    needingEmbeddings: number;
    pgvector: boolean;
    provider: {
      configured: boolean;
      provider: string | null;
      message: string;
      expectedDimensions?: number;
    };
  };
  sampleFeedbackIds: string[];
};

export function EmbeddingPanel({
  canEmbed,
  stats,
  sampleFeedbackIds,
}: EmbeddingPanelProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryTone, setSummaryTone] = useState<"success" | "danger">(
    "success",
  );

  async function handleBatch() {
    setError("");
    setSummary("");

    if (!canEmbed) {
      setError("You do not have permission to generate embeddings.");
      return;
    }

    if (sampleFeedbackIds.length === 0) {
      setError("No feedback available to embed.");
      return;
    }

    setIsLoading(true);

    const response = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedbackIds: sampleFeedbackIds.slice(0, 20),
      }),
    });

    const data = (await response.json()) as {
      succeeded?: number;
      failed?: number;
      error?: string;
      results?: Array<{ ok: boolean; error?: string }>;
    };

    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Batch embedding failed");
      return;
    }

    const succeeded = data.succeeded ?? 0;
    const failed = data.failed ?? 0;
    const firstFailure = data.results?.find((item) => !item.ok)?.error;

    const base = `Batch complete — succeeded: ${succeeded}, failed: ${failed}`;
    setSummary(
      failed > 0 && firstFailure ? `${base}. ${firstFailure}` : base,
    );
    // Green only when every item succeeded; any failure → red
    setSummaryTone(failed === 0 && succeeded > 0 ? "success" : "danger");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Feedback" value={stats.totalFeedback} />
        <Stat label="Ready embeddings" value={stats.ready} />
        <Stat label="Failed" value={stats.failed} />
        <Stat label="Still to embed" value={stats.needingEmbeddings} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p>
          <span className="font-medium">pgvector:</span>{" "}
          {stats.pgvector ? "available" : "not available"}
        </p>
        <p className="mt-1">
          <span className="font-medium">Provider:</span>{" "}
          {stats.provider.configured
            ? stats.provider.provider
            : "not configured"}
        </p>
        <p className="mt-1">
          <span className="font-medium">Expected dimensions:</span>{" "}
          {stats.provider.expectedDimensions ?? 768} (gemini-embedding-001 @
          768-d or nomic-embed-text / vector(768))
        </p>
        <p className="mt-2 text-slate-500">{stats.provider.message}</p>
        <p className="mt-2 text-slate-500">
          Embeddings are never faked. Without a configured provider, generation
          returns a clear error and stores nothing as READY.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {summary ? (
        <div
          className={
            summaryTone === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {summary}
        </div>
      ) : null}

      {canEmbed ? (
        <>
          <Button
            type="button"
            onClick={() => void handleBatch()}
            isLoading={isLoading}
            disabled={
              !stats.provider.configured ||
              !stats.pgvector ||
              sampleFeedbackIds.length === 0
            }
          >
            {sampleFeedbackIds.length === 0
              ? "All feedback embedded"
              : `Embed next ${sampleFeedbackIds.length} of ${stats.needingEmbeddings}`}
          </Button>
          {stats.needingEmbeddings > sampleFeedbackIds.length ? (
            <p className="text-sm text-slate-500">
              Click again after each batch for the next{" "}
              {Math.min(20, stats.needingEmbeddings - sampleFeedbackIds.length)}{" "}
              — Gemini free tier works best in small batches.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">
          Viewers cannot generate embeddings.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
