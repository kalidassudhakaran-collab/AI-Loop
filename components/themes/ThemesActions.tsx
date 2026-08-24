"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ThemesActionsProps = {
  canManage: boolean;
};

export function ThemesActions({ canManage }: ThemesActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  if (!canManage) {
    return (
      <p className="text-sm text-slate-500">
        Viewers can browse themes but cannot consolidate or edit them.
      </p>
    );
  }

  async function handleConsolidate() {
    setError("");
    setResult("");
    setIsLoading(true);

    const response = await fetch("/api/themes/consolidate", { method: "POST" });
    const data = (await response.json()) as {
      mergedGroups?: number;
      themesRemoved?: number;
      linksReassigned?: number;
      error?: string;
    };

    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Consolidation failed");
      return;
    }

    setResult(
      `Merged groups: ${data.mergedGroups ?? 0} · Themes removed: ${data.themesRemoved ?? 0} · Links reassigned: ${data.linksReassigned ?? 0}`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Deterministic clustering normalizes aliases (e.g. &quot;login problem&quot; →
        Authentication) and merges duplicate themes inside this workspace only.
      </p>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {result}
        </div>
      ) : null}
      <Button type="button" onClick={() => void handleConsolidate()} isLoading={isLoading}>
        Consolidate duplicate themes
      </Button>
    </div>
  );
}
