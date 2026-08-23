"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type ThemeOption = {
  id: string;
  name: string;
};

type InboxFiltersProps = {
  channels: string[];
  themes: ThemeOption[];
};

export function InboxFilters({ channels, themes }: InboxFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = {
    q: searchParams.get("q") ?? "",
    channel: searchParams.get("channel") ?? "",
    sentiment: searchParams.get("sentiment") ?? "",
    themeId: searchParams.get("themeId") ?? "",
    status: searchParams.get("status") ?? "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  };

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();

    const fields = ["q", "channel", "sentiment", "themeId", "status", "from", "to"] as const;
    for (const field of fields) {
      const value = String(formData.get(field) ?? "").trim();
      if (value) {
        params.set(field, value);
      }
    }

    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(new FormData(event.currentTarget));
  }

  function handleClear() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Search feedback"
        name="q"
        defaultValue={current.q}
        placeholder="Search content… e.g. onboarding, billing, SSO"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Select
          label="Channel"
          name="channel"
          defaultValue={current.channel}
          options={[
            { value: "", label: "All channels" },
            ...channels.map((channel) => ({ value: channel, label: channel })),
          ]}
        />

        <Select
          label="Sentiment"
          name="sentiment"
          defaultValue={current.sentiment}
          options={[
            { value: "", label: "All sentiments" },
            { value: "POS", label: "Positive" },
            { value: "NEU", label: "Neutral" },
            { value: "NEG", label: "Negative" },
          ]}
        />

        <Select
          label="Theme"
          name="themeId"
          defaultValue={current.themeId}
          options={[
            { value: "", label: "All themes" },
            ...themes.map((theme) => ({ value: theme.id, label: theme.name })),
          ]}
        />

        <Select
          label="Status"
          name="status"
          defaultValue={current.status}
          options={[
            { value: "", label: "All statuses" },
            { value: "NEW", label: "NEW" },
            { value: "REVIEWED", label: "REVIEWED" },
            { value: "ACTIONED", label: "ACTIONED" },
          ]}
        />

        <div className="grid grid-cols-2 gap-2">
          <Input label="From" name="from" type="date" defaultValue={current.from} />
          <Input label="To" name="to" type="date" defaultValue={current.to} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" isLoading={isPending}>
          Apply filters
        </Button>
        <Button type="button" variant="secondary" onClick={handleClear}>
          Clear
        </Button>
      </div>
    </form>
  );
}
