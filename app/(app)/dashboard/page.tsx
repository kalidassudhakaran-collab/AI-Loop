import { Role } from "@prisma/client";
import { Card, CardHeader } from "@/components/ui/Card";
import { getAuthenticatedUser } from "@/lib/session";
import { getWorkspaceStats } from "@/lib/services/feedback-service";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const stats = await getWorkspaceStats(user.workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          Overview of feedback activity in {user.workspaceName}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total feedback</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">New this period</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.newCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Negative sentiment</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.negativePercent}%
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Your workspace"
          description="M1 foundation — analytics charts arrive in Week 2."
        />
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Workspace</dt>
            <dd className="font-medium text-slate-900">{user.workspaceName}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Signed in as</dt>
            <dd className="font-medium text-slate-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Role</dt>
            <dd className="font-medium text-slate-900">{user.role}</dd>
          </div>
        </dl>
        {user.role === Role.VIEWER ? (
          <p className="mt-4 text-sm text-amber-700">
            You have read-only access. Contact an admin to add or triage feedback.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
