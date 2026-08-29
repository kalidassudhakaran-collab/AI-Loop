"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type AppHeaderProps = {
  workspaceName: string;
  userName: string;
  userRole: string;
  onOpenNav?: () => void;
};

export function AppHeader({
  workspaceName,
  userName,
  userRole,
  onOpenNav,
}: AppHeaderProps) {
  return (
    <header className="no-print flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
          onClick={onOpenNav}
          aria-label="Open navigation"
        >
          ☰
        </button>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Workspace
          </p>
          <h1 className="truncate text-lg font-semibold text-slate-900">
            {workspaceName}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{userName}</p>
          <Badge tone="info">{userRole}</Badge>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
