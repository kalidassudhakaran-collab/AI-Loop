import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
          <div className="text-white">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
              Project LOOP
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight">
              Close the loop on customer feedback.
            </h1>
            <p className="mt-4 max-w-lg text-slate-300">
              Turn scattered support tickets, reviews, and survey responses into
              evidence-backed product decisions.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-white p-8 shadow-2xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
