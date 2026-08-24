"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type ClassificationPayload = {
  sentiment: "POS" | "NEU" | "NEG";
  sentimentScore: number;
  featureArea: string;
  confidence: number;
  themes: Array<{ name: string; confidence: number }>;
};

type ClassifyFeedbackButtonProps = {
  feedbackId: string;
  canClassify: boolean;
  alreadyClassified: boolean;
};

function sentimentLabel(sentiment: ClassificationPayload["sentiment"]) {
  switch (sentiment) {
    case "POS":
      return "Positive";
    case "NEG":
      return "Negative";
    default:
      return "Neutral";
  }
}

export function ClassifyFeedbackButton({
  feedbackId,
  canClassify,
  alreadyClassified,
}: ClassifyFeedbackButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClassificationPayload | null>(null);

  if (!canClassify) {
    return null;
  }

  async function handleClassify() {
    setError("");
    setResult(null);
    setIsLoading(true);

    const response = await fetch(`/api/feedback/${feedbackId}/classify`, {
      method: "POST",
    });

    const data = (await response.json()) as {
      classification?: ClassificationPayload;
      error?: string;
    };

    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Classification failed");
      return;
    }

    if (data.classification) {
      setResult(data.classification);
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="whitespace-nowrap"
        isLoading={isLoading}
        onClick={() => void handleClassify()}
      >
        {alreadyClassified ? "Re-classify with AI" : "Classify with AI"}
      </Button>

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}

      {result ? (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">AI Classification</p>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Sentiment</dt>
              <dd className="font-medium">{sentimentLabel(result.sentiment)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Score</dt>
              <dd className="font-medium">{result.sentimentScore.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Feature area</dt>
              <dd className="font-medium">{result.featureArea}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Confidence</dt>
              <dd className="font-medium">
                {Math.round(result.confidence * 100)}%
              </dd>
            </div>
          </dl>
          <div className="mt-2 flex flex-wrap gap-1">
            {result.themes.map((theme) => (
              <Badge key={theme.name} tone="info">
                {theme.name}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
