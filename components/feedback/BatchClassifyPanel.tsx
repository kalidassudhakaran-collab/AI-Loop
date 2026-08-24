"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type BatchClassifyPanelProps = {
  canClassify: boolean;
  feedbackIds: string[];
};

export function BatchClassifyPanel({
  canClassify,
  feedbackIds,
}: BatchClassifyPanelProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");

  if (!canClassify) {
    return (
      <p className="text-sm text-slate-500">
        Viewers cannot run AI classification.
      </p>
    );
  }

  const ids = feedbackIds.slice(0, 10);

  async function handleBatch() {
    if (ids.length === 0) {
      setError("No feedback on this page to classify.");
      return;
    }

    setError("");
    setSummary("");
    setIsLoading(true);

    const response = await fetch("/api/feedback/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackIds: ids }),
    });

    const data = (await response.json()) as {
      succeeded?: number;
      failed?: number;
      error?: string;
    };

    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Batch classification failed");
      return;
    }

    setSummary(
      `Batch complete — succeeded: ${data.succeeded ?? 0}, failed: ${data.failed ?? 0}`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Classify up to 10 feedback items from the current page. Runs only when
        you click — never on page load. Concurrency is limited on the server.
      </p>

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

      <Button
        type="button"
        onClick={() => void handleBatch()}
        isLoading={isLoading}
        disabled={ids.length === 0}
      >
        Classify {ids.length} item{ids.length === 1 ? "" : "s"} on this page
      </Button>
    </div>
  );
}
