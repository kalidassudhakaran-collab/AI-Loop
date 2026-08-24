"use client";

import type { Feedback, FeedbackStatus, Sentiment } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClassifyFeedbackButton } from "@/components/feedback/ClassifyFeedbackButton";
import { Badge } from "@/components/ui/Badge";

type FeedbackThemeLink = {
  confidence: number;
  theme: {
    id: string;
    name: string;
    color: string;
  };
};

type FeedbackRow = Feedback & {
  featureArea?: string | null;
  classificationConfidence?: number | null;
  classifiedAt?: Date | null;
  themes?: FeedbackThemeLink[];
};

type FeedbackListProps = {
  feedback: FeedbackRow[];
  canEditStatus: boolean;
  canClassify: boolean;
};

function sentimentTone(sentiment: Sentiment | null) {
  switch (sentiment) {
    case "POS":
      return "success";
    case "NEG":
      return "danger";
    case "NEU":
      return "warning";
    default:
      return "default";
  }
}

function statusTone(status: FeedbackStatus) {
  switch (status) {
    case "NEW":
      return "info";
    case "REVIEWED":
      return "warning";
    case "ACTIONED":
      return "success";
    default:
      return "default";
  }
}

export function FeedbackList({
  feedback,
  canEditStatus,
  canClassify,
}: FeedbackListProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleStatusChange(id: string, status: FeedbackStatus) {
    setError("");
    setUpdatingId(id);

    const response = await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = (await response.json()) as { error?: string };
    setUpdatingId(null);

    if (!response.ok) {
      setError(data.error ?? "Unable to update status");
      return;
    }

    router.refresh();
  }

  if (feedback.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <h3 className="text-base font-medium text-slate-900">No feedback found</h3>
        <p className="mt-2 text-sm text-slate-500">
          Try changing your filters or importing more feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Content
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Channel
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Themes
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Sentiment
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  AI
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feedback.map((item) => (
                <tr key={item.id} className="align-top hover:bg-slate-50">
                  <td className="max-w-md px-4 py-3 text-slate-900">
                    <p>{item.content}</p>
                    {item.customerLabel ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {item.customerLabel}
                      </p>
                    ) : null}
                    {item.featureArea ? (
                      <p className="mt-1 text-xs text-indigo-700">
                        Feature area: {item.featureArea}
                        {typeof item.classificationConfidence === "number"
                          ? ` · ${Math.round(item.classificationConfidence * 100)}%`
                          : ""}
                      </p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {item.channel}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(item.themes ?? []).length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        item.themes?.map((link) => (
                          <Badge key={link.theme.id} tone="default">
                            {link.theme.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={sentimentTone(item.sentiment)}>
                      {item.sentiment ?? "Unclassified"}
                    </Badge>
                    {typeof item.sentimentScore === "number" ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {item.sentimentScore.toFixed(2)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {canEditStatus ? (
                      <select
                        value={item.status}
                        disabled={updatingId === item.id}
                        onChange={(event) =>
                          void handleStatusChange(
                            item.id,
                            event.target.value as FeedbackStatus,
                          )
                        }
                        className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                        aria-label={`Update status for feedback ${item.id}`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="REVIEWED">REVIEWED</option>
                        <option value="ACTIONED">ACTIONED</option>
                      </select>
                    ) : (
                      <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ClassifyFeedbackButton
                      feedbackId={item.id}
                      canClassify={canClassify}
                      alreadyClassified={Boolean(item.classifiedAt)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
