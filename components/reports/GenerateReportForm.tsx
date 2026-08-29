"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: isoDate(from), to: isoDate(to) };
}

type GenerateReportFormProps = {
  canGenerate: boolean;
};

export function GenerateReportForm({ canGenerate }: GenerateReportFormProps) {
  const router = useRouter();
  const initial = useMemo(() => defaultRange(30), []);
  const [title, setTitle] = useState("");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!canGenerate) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Viewers can open saved reports but cannot generate new ones.
      </div>
    );
  }

  function applyPreset(days: number) {
    const range = defaultRange(days);
    setFrom(range.from);
    setTo(range.to);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || undefined,
        from,
        to,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      report?: { id: string };
    };

    setIsLoading(false);

    if (!response.ok || !data.report) {
      setError(data.error ?? "Unable to generate report");
      return;
    }

    router.push(`/reports/${data.report.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Input
        label="Title (optional)"
        name="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Leadership digest — August"
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => applyPreset(7)}>
          Last 7 days
        </Button>
        <Button type="button" variant="secondary" onClick={() => applyPreset(30)}>
          Last 30 days
        </Button>
        <Button type="button" variant="secondary" onClick={() => applyPreset(90)}>
          Last 90 days
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="From"
          name="from"
          type="date"
          required
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <Input
          label="To"
          name="to"
          type="date"
          required
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>

      <Button type="submit" isLoading={isLoading}>
        Generate Voice-of-Customer report
      </Button>
      <p className="text-xs text-slate-500">
        Stats are computed from this workspace&apos;s feedback first. Claude then
        writes the narrative around those numbers — it cannot invent figures.
      </p>
    </form>
  );
}
