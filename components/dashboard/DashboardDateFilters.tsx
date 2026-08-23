"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function DashboardDateFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const nextFrom = String(formData.get("from") ?? "").trim();
    const nextTo = String(formData.get("to") ?? "").trim();

    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function handleClear() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <Input label="From" name="from" type="date" defaultValue={from} />
      <Input label="To" name="to" type="date" defaultValue={to} />
      <Button type="submit" isLoading={isPending}>
        Update charts
      </Button>
      <Button type="button" variant="secondary" onClick={handleClear}>
        Reset
      </Button>
    </form>
  );
}
