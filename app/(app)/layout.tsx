import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { getOptionalSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getOptionalSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader
          workspaceName={session.user.workspaceName}
          userName={session.user.name}
          userRole={session.user.role}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
