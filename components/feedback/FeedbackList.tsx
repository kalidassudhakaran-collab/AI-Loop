import type { Feedback, Sentiment } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";

type FeedbackListProps = {
  feedback: Feedback[];
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

function statusTone(status: Feedback["status"]) {
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

export function FeedbackList({ feedback }: FeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <h3 className="text-base font-medium text-slate-900">No feedback yet</h3>
        <p className="mt-2 text-sm text-slate-500">
          Add your first customer feedback item to start building your inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Content</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Channel</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Sentiment</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {feedback.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="max-w-md px-4 py-3 text-slate-900">{item.content}</td>
                <td className="px-4 py-3 text-slate-600">{item.channel}</td>
                <td className="px-4 py-3 text-slate-600">
                  {item.customerLabel ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={sentimentTone(item.sentiment)}>
                    {item.sentiment ?? "Unclassified"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
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
  );
}
