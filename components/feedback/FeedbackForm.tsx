"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FEEDBACK_CHANNELS } from "@/lib/validation/feedback";

type FeedbackFormProps = {
  canCreate: boolean;
};

export function FeedbackForm({ canCreate }: FeedbackFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<string>(FEEDBACK_CHANNELS[0]);
  const [customerLabel, setCustomerLabel] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!canCreate) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Your role is read-only. Viewers cannot add feedback.
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        channel,
        customerLabel: customerLabel || null,
        sourceRef: sourceRef || null,
      }),
    });

    const data = (await response.json()) as { error?: string; classification?: { classified: boolean } };

    setIsLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to create feedback");
      return;
    }

    setContent("");
    setCustomerLabel("");
    setSourceRef("");
    setSuccess(
      data.classification?.classified
        ? "Feedback added and classified with Claude."
        : "Feedback added and queued for AI classification.",
    );
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="space-y-1">
        <label htmlFor="content" className="block text-sm font-medium text-slate-700">
          Feedback content
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={4}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="What did the customer say?"
        />
      </div>

      <Select
        label="Channel"
        name="channel"
        value={channel}
        onChange={(event) => setChannel(event.target.value)}
        options={FEEDBACK_CHANNELS.map((item) => ({ value: item, label: item }))}
      />

      <Input
        label="Customer label (optional)"
        name="customerLabel"
        value={customerLabel}
        onChange={(event) => setCustomerLabel(event.target.value)}
        placeholder="e.g. Acme Corp"
      />

      <Input
        label="Source reference (optional)"
        name="sourceRef"
        value={sourceRef}
        onChange={(event) => setSourceRef(event.target.value)}
        placeholder="e.g. TICKET-1042"
      />

      <Button type="submit" isLoading={isLoading}>
        Add feedback
      </Button>
    </form>
  );
}
