import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/reports/PrintButton";
import { ReportDocument } from "@/components/reports/ReportDocument";
import { NotFoundError } from "@/lib/errors";
import { getWorkspaceReport } from "@/lib/services/report-service";
import { getAuthenticatedUser } from "@/lib/session";

type ShareReportPageProps = {
  params: { id: string };
};

export default async function ShareReportPage({ params }: ShareReportPageProps) {
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
    <div className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/reports/${report.id}`}
          className="text-sm font-medium text-indigo-700 hover:underline"
        >
          ← Back to report
        </Link>
        <PrintButton />
      </div>
      <ReportDocument
        title={report.title}
        generatedByName={report.generatedBy.name}
        createdAt={report.createdAt}
        content={report.content}
      />
    </div>
  );
}
