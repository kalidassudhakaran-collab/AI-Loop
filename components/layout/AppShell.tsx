"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

type AppShellProps = {
  workspaceName: string;
  userName: string;
  userRole: string;
  children: React.ReactNode;
};

export function AppShell({
  workspaceName,
  userName,
  userRole,
  children,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow"
      >
        Skip to content
      </a>
      <AppSidebar
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppHeader
          workspaceName={workspaceName}
          userName={userName}
          userRole={userRole}
          onOpenNav={() => setMobileNavOpen(true)}
        />
        <main id="main-content" className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
