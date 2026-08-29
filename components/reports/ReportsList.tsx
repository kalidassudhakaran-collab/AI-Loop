import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

type ReportListItem = {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  generatedBy: { name: string };
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function ReportsList({ reports }: { reports: ReportListItem[] }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        No reports yet. Generate a digest for a date range to get a
        leadership-ready Voice-of-Customer summary.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {reports.map((report) => (
        <li key={report.id}>
          <Link
            href={`/reports/${report.id}`}
            className="flex flex-col gap-2 px-4 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-slate-900">{report.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="info">{report.generatedBy.name}</Badge>
              <span className="text-xs text-slate-400">
                {formatDate(report.createdAt)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
