"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
};

export function InboxPagination({ page, totalPages, total }: PaginationProps) {
  const searchParams = useSearchParams();

  function hrefForPage(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    return `/inbox?${params.toString()}`;
  }

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <p className="text-slate-600">
        Page <span className="font-medium text-slate-900">{page}</span> of{" "}
        <span className="font-medium text-slate-900">{totalPages}</span>
        <span className="text-slate-400"> · {total} total</span>
      </p>

      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-400">
            Previous
          </span>
        ) : (
          <Link
            href={hrefForPage(page - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Previous
          </Link>
        )}

        {page >= totalPages ? (
          <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-400">
            Next
          </span>
        ) : (
          <Link
            href={hrefForPage(page + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
