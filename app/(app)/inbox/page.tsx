import { Role } from "@prisma/client";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { FeedbackList } from "@/components/feedback/FeedbackList";
import { Card, CardHeader } from "@/components/ui/Card";
import { listWorkspaceFeedback } from "@/lib/services/feedback-service";
import { getAuthenticatedUser } from "@/lib/session";
import { FEEDBACK_WRITE_ROLES, hasRole } from "@/lib/permissions";

export default async function InboxPage() {
  const user = await getAuthenticatedUser();
  const feedback = await listWorkspaceFeedback(user.workspaceId);
  const canCreate = hasRole(user.role, FEEDBACK_WRITE_ROLES);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Feedback inbox</h2>
        <p className="mt-1 text-sm text-slate-500">
          View and add customer feedback for your workspace.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Add feedback"
          description="Single-entry ingestion — bulk import arrives in Week 2."
        />
        <FeedbackForm canCreate={canCreate} />
      </Card>

      <div>
        <h3 className="mb-3 text-lg font-medium text-slate-900">
          All feedback ({feedback.length})
        </h3>
        <FeedbackList feedback={feedback} />
      </div>

      {user.role === Role.VIEWER ? (
        <p className="text-sm text-slate-500">
          Viewers can read feedback but cannot create new items.
        </p>
      ) : null}
    </div>
  );
}
