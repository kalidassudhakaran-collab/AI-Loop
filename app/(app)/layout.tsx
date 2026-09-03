import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getOptionalSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getOptionalSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell
      workspaceName={session.user.workspaceName}
      userName={session.user.name}
      userRole={session.user.role}
    >
      {children}
    </AppShell>
  );
}
