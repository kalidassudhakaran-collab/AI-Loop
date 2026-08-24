import { Suspense } from "react";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { FeedbackList } from "@/components/feedback/FeedbackList";
import { CsvUploadForm } from "@/components/feedback/CsvUploadForm";
import { SimulateChannelButton } from "@/components/feedback/SimulateChannelButton";
import { BatchClassifyPanel } from "@/components/feedback/BatchClassifyPanel";
import { InboxFilters } from "@/components/feedback/InboxFilters";
import { InboxPagination } from "@/components/feedback/InboxPagination";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  AI_CLASSIFY_ROLES,
  FEEDBACK_WRITE_ROLES,
  hasRole,
} from "@/lib/permissions";
import {
  listWorkspaceChannels,
  listWorkspaceThemes,
  queryWorkspaceFeedback,
} from "@/lib/services/feedback-service";
import { getAuthenticatedUser } from "@/lib/session";
import { feedbackQuerySchema } from "@/lib/validation/feedback";

type InboxPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const user = await getAuthenticatedUser();
  const canWrite = hasRole(user.role, FEEDBACK_WRITE_ROLES);
  const canClassify = hasRole(user.role, AI_CLASSIFY_ROLES);

  const parsed = feedbackQuerySchema.safeParse({
    q: firstValue(searchParams.q),
    channel: firstValue(searchParams.channel),
    sentiment: firstValue(searchParams.sentiment),
    themeId: firstValue(searchParams.themeId),
    status: firstValue(searchParams.status),
    from: firstValue(searchParams.from),
    to: firstValue(searchParams.to),
    page: firstValue(searchParams.page) || "1",
    pageSize: firstValue(searchParams.pageSize) || "20",
  });

  const filters = parsed.success
    ? parsed.data
    : feedbackQuerySchema.parse({});

  const [result, themes, channels] = await Promise.all([
    queryWorkspaceFeedback(user.workspaceId, filters),
    listWorkspaceThemes(user.workspaceId),
    listWorkspaceChannels(user.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Feedback inbox</h2>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, triage, and ingest feedback for {user.workspaceName}.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Add feedback"
            description="Create a single feedback item."
          />
          <FeedbackForm canCreate={canWrite} />
        </Card>

        <Card>
          <CardHeader
            title="CSV bulk upload"
            description="Import many rows at once. Invalid rows are reported without aborting the whole file."
          />
          <CsvUploadForm canImport={canWrite} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Simulate channel"
          description="Demo integration — imports sample support tickets into your workspace."
        />
        <SimulateChannelButton canSimulate={canWrite} />
      </Card>

      <Card>
        <CardHeader
          title="AI classification"
          description="Explicitly classify feedback with Claude. Never runs automatically on page load."
        />
        <BatchClassifyPanel
          canClassify={canClassify}
          feedbackIds={result.items.map((item) => item.id)}
        />
      </Card>

      <Card>
        <CardHeader
          title="Filters"
          description="Filters, search, and pagination run on the server and stay in the URL."
        />
        <Suspense fallback={<p className="text-sm text-slate-500">Loading filters…</p>}>
          <InboxFilters channels={channels} themes={themes} />
        </Suspense>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-slate-900">
          Results ({result.pagination.total})
        </h3>
        <FeedbackList
          feedback={result.items}
          canEditStatus={canWrite}
          canClassify={canClassify}
        />
        <Suspense fallback={null}>
          <InboxPagination
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            total={result.pagination.total}
          />
        </Suspense>
      </div>
    </div>
  );
}
