import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportDocument } from "@/components/reports/ReportDocument";
import { ReportExportActions } from "@/components/reports/ReportExportActions";
import { Card } from "@/components/ui/Card";
import { NotFoundError } from "@/lib/errors";
import { getWorkspaceReport } from "@/lib/services/report-service";
import { getAuthenticatedUser } from "@/lib/session";

type ReportPageProps = {
  params: { id: string };
};

export default async function ReportPage({ params }: ReportPageProps) {
  const user = await getAuthenticatedUser();

  let report;
  try {
    report = await getWorkspaceReport(user.workspaceId, params.id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/reports"
          className="text-sm font-medium text-indigo-700 hover:underline"
        >
          ← All reports
        </Link>
        <ReportExportActions reportId={report.id} title={report.title} />
      </div>

      <Card className="print:border-0 print:p-0 print:shadow-none">
        <ReportDocument
          title={report.title}
          generatedByName={report.generatedBy.name}
          createdAt={report.createdAt}
          content={report.content}
        />
      </Card>
    </div>
  );
}
