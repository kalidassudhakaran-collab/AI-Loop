"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type AppHeaderProps = {
  workspaceName: string;
  userName: string;
  userRole: string;
};

export function AppHeader({
  workspaceName,
  userName,
  userRole,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Workspace
        </p>
        <h1 className="text-lg font-semibold text-slate-900">{workspaceName}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{userName}</p>
          <Badge tone="info">{userRole}</Badge>
        </div>
        <Button
          variant="secondary"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
