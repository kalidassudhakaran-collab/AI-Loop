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
    };

    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Batch embedding failed");
      return;
    }

    setSummary(
      `Batch complete — succeeded: ${data.succeeded ?? 0}, failed: ${data.failed ?? 0}`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Feedback" value={stats.totalFeedback} />
        <Stat label="Ready embeddings" value={stats.ready} />
        <Stat label="Failed" value={stats.failed} />
        <Stat label="Not embedded" value={stats.notEmbedded} />
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
          {stats.provider.expectedDimensions ?? 768} (nomic-embed-text /
          vector(768))
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
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {summary}
        </div>
      ) : null}

      {canEmbed ? (
        <Button
          type="button"
          onClick={() => void handleBatch()}
          isLoading={isLoading}
          disabled={!stats.provider.configured || !stats.pgvector}
        >
          Embed up to {Math.min(sampleFeedbackIds.length, 20)} recent items
        </Button>
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
