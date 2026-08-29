import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
        403
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        You don&apos;t have access
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Your role cannot perform that action. Ask a workspace admin if you need
        a different permission.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
