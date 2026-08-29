"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

type ReportExportActionsProps = {
  reportId: string;
  title: string;
};

export function ReportExportActions({
  reportId,
  title,
}: ReportExportActionsProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button type="button" onClick={handlePrint}>
        Print / Save as PDF
      </Button>
      <Link
        href={`/share/reports/${reportId}`}
        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Open shareable page
      </Link>
      <span className="self-center text-xs text-slate-500">
        {title} — use your browser&apos;s print dialog to save a PDF.
      </span>
    </div>
  );
}
