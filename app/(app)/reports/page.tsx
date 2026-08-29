import { GenerateReportForm } from "@/components/reports/GenerateReportForm";
import { ReportsList } from "@/components/reports/ReportsList";
import { Card, CardHeader } from "@/components/ui/Card";
import { REPORT_GENERATE_ROLES, hasRole } from "@/lib/permissions";
import { listWorkspaceReports } from "@/lib/services/report-service";
import { getAuthenticatedUser } from "@/lib/session";

export default async function ReportsPage() {
  const user = await getAuthenticatedUser();
  const canGenerate = hasRole(user.role, REPORT_GENERATE_ROLES);
  const reports = await listWorkspaceReports(user.workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Voice-of-Customer reports
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Generate a leadership digest from {user.workspaceName}&apos;s real
          feedback for a chosen period — then save, reopen, or export it.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Generate a report"
          description="LOOP pre-computes volume, sentiment, themes, and quotes, then writes a narrative around those numbers."
        />
        <GenerateReportForm canGenerate={canGenerate} />
      </Card>

      <Card>
        <CardHeader
          title={`Saved reports (${reports.length})`}
          description="Reports are scoped to this workspace and stay available after you leave the page."
        />
        <ReportsList reports={reports} />
      </Card>
    </div>
  );
}
