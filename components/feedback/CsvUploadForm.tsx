"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type ImportResult = {
  imported: number;
  failed: number;
  failures: Array<{ row: number; message: string }>;
  error?: string;
};

type CsvUploadFormProps = {
  canImport: boolean;
};

export function CsvUploadForm({ canImport }: CsvUploadFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!canImport) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Viewers cannot upload CSV files.
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a CSV file");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/feedback/import", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as ImportResult;
    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "CSV import failed");
      return;
    }

    setResult(data);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-500">
        Required columns:{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">
          content, channel, customer_label, created_at
        </code>
      </p>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <p className="font-medium text-slate-900">Import completed</p>
          <p className="mt-1 text-slate-700">
            Imported: {result.imported} · Failed: {result.failed}
          </p>
          {result.failures.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              {result.failures.slice(0, 10).map((failure) => (
                <li key={`${failure.row}-${failure.message}`}>
                  Row {failure.row} — {failure.message}
                </li>
              ))}
              {result.failures.length > 10 ? (
                <li>…and {result.failures.length - 10} more</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
      />

      <Button type="submit" isLoading={isLoading}>
        Upload CSV
      </Button>
    </form>
  );
}
