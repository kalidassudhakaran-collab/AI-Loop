"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

type AskCitation = {
  feedbackId: string;
  contentPreview: string;
  similarity: number;
  channel: string;
  sentiment: string | null;
  reason?: string;
};

type AskResponse = {
  status: string;
  message: string;
  answer: string | null;
  citations: AskCitation[];
  debug?: {
    retrievedCount: number;
    evidenceCount: number;
    bestSimilarity: number | null;
    minSimilarity: number;
    evidenceIds: string[];
    embeddingProvider: string | null;
    anthropicConfigured: boolean;
  };
  error?: string;
};

type AskLoopPanelProps = {
  canAsk: boolean;
};

export function AskLoopPanel({ canAsk }: AskLoopPanelProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!canAsk) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        You do not have permission to use Ask LOOP.
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);
    setSelectedId(null);

    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = (await response.json()) as AskResponse;
    setIsLoading(false);

    if (!response.ok) {
      setResult({
        status: "ERROR",
        message: data.error ?? data.message ?? "Ask LOOP request failed",
        answer: null,
        citations: [],
      });
      return;
    }

    setResult(data);
    if (data.citations[0]) {
      setSelectedId(data.citations[0].feedbackId);
    }
  }

  const selected = result?.citations.find(
    (citation) => citation.feedbackId === selectedId,
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="ask-question"
            className="block text-sm font-medium text-slate-700"
          >
            Ask a question about your customer feedback
          </label>
          <textarea
            id="ask-question"
            name="question"
            required
            minLength={3}
            maxLength={1000}
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What are customers complaining about with onboarding?"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button type="submit" isLoading={isLoading}>
          Ask LOOP
        </Button>
      </form>

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-600">Searching feedback…</p>
        </Card>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <StatusBanner status={result.status} message={result.message} />

          {result.answer ? (
            <Card>
              <CardHeader title="Answer" description="Grounded in retrieved evidence only." />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {result.answer}
              </p>
            </Card>
          ) : null}

          {result.citations.length > 0 ? (
            <Card>
              <CardHeader
                title="Evidence"
                description="Only feedback retrieved from your workspace. Click a citation to inspect it."
              />
              <div className="space-y-2">
                {result.citations.map((citation) => (
                  <button
                    key={citation.feedbackId}
                    type="button"
                    onClick={() => setSelectedId(citation.feedbackId)}
                    className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
                      selectedId === citation.feedbackId
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">{citation.feedbackId.slice(0, 8)}…</Badge>
                      <Badge tone="default">{citation.channel}</Badge>
                      {citation.sentiment ? (
                        <Badge tone="warning">{citation.sentiment}</Badge>
                      ) : null}
                      <span className="text-xs text-slate-500">
                        similarity {(citation.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-2 text-slate-700">{citation.contentPreview}</p>
                    {citation.reason ? (
                      <p className="mt-1 text-xs text-slate-500">{citation.reason}</p>
                    ) : null}
                  </button>
                ))}
              </div>

              {selected ? (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="font-medium text-slate-900">Selected evidence</p>
                  <p className="mt-1 text-xs text-slate-500">{selected.feedbackId}</p>
                  <p className="mt-2 text-slate-700">{selected.contentPreview}</p>
                </div>
              ) : null}
            </Card>
          ) : null}

          {result.debug ? (
            <Card>
              <CardHeader
                title="Debug"
                description="Development only — no prompts or secrets."
              />
              <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Retrieved</dt>
                  <dd>{result.debug.retrievedCount}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Evidence selected</dt>
                  <dd>{result.debug.evidenceCount}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Best similarity</dt>
                  <dd>
                    {result.debug.bestSimilarity === null
                      ? "—"
                      : result.debug.bestSimilarity.toFixed(4)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Min threshold</dt>
                  <dd>{result.debug.minSimilarity.toFixed(4)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Embedding provider</dt>
                  <dd>{result.debug.embeddingProvider ?? "none"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Anthropic configured</dt>
                  <dd>{result.debug.anthropicConfigured ? "yes" : "no"}</dd>
                </div>
              </dl>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatusBanner({ status, message }: { status: string; message: string }) {
  const tone =
    status === "ANSWERED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "INSUFFICIENT_EVIDENCE"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : status === "NO_EMBEDDINGS" ||
            status === "EMBEDDING_PROVIDER_UNAVAILABLE" ||
            status === "AI_PROVIDER_UNAVAILABLE"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : status === "ERROR"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">{status.split("_").join(" ")}</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
