import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/session";

export default async function ShareLayout({ children }: { children: ReactNode }) {
  const session = await getOptionalSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="no-print border-b border-slate-200 px-6 py-3 text-sm text-slate-500">
        LOOP shareable report · {session.user.workspaceName}
      </div>
      {children}
    </div>
  );
}
