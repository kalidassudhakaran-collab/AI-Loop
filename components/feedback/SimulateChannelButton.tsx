"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type SimulateChannelButtonProps = {
  canSimulate: boolean;
};

export function SimulateChannelButton({ canSimulate }: SimulateChannelButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!canSimulate) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Viewers cannot simulate channel imports.
      </div>
    );
  }

  async function handleClick() {
    setError("");
    setSuccess("");
    setIsLoading(true);

    const response = await fetch("/api/feedback/simulate", {
      method: "POST",
    });

    const data = (await response.json()) as {
      created?: number;
      channel?: string;
      classificationQueued?: number;
      error?: string;
    };

    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Simulation failed");
      return;
    }

    setSuccess(
      `Imported ${data.created ?? 0} sample ${data.channel ?? "channel"} items${
        data.classificationQueued
          ? ` and queued ${data.classificationQueued} for classification`
          : ""
      }.`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Mimic a support-ticket integration without real third-party credentials.
        Creates realistic tickets in your workspace with status NEW.
      </p>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <Button type="button" onClick={() => void handleClick()} isLoading={isLoading}>
        Import sample support tickets
      </Button>
    </div>
  );
}
