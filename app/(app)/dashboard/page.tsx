import { Suspense } from "react";
import {
  SentimentChart,
  TopThemesChart,
  VolumeChart,
} from "@/components/dashboard/DashboardCharts";
import { DashboardDateFilters } from "@/components/dashboard/DashboardDateFilters";
import { Card, CardHeader } from "@/components/ui/Card";
import { getDashboardData } from "@/lib/services/dashboard-service";
import { getAuthenticatedUser } from "@/lib/session";
import { dashboardQuerySchema } from "@/lib/validation/feedback";

type DashboardPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getAuthenticatedUser();

  const parsed = dashboardQuerySchema.safeParse({
    from: firstValue(searchParams.from),
    to: firstValue(searchParams.to),
  });

  const filters = parsed.success ? parsed.data : { from: "", to: "" };
  const data = await getDashboardData(user.workspaceId, filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            Real analytics for {user.workspaceName}. Charts update with the date range.
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading filters…</p>}>
          <DashboardDateFilters />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total feedback</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {data.stats.total}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Negative</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {data.stats.negativePercent}%
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">New this week</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {data.stats.newThisWeek}
          </p>
        </Card>
      </div>

      {data.stats.total === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <h3 className="text-base font-medium text-slate-900">No feedback yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Import a CSV, simulate a channel, or add feedback to populate charts.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Volume over time"
              description="Daily feedback count for the selected date range."
            />
            <VolumeChart data={data.volumeOverTime} />
          </Card>

          <Card>
            <CardHeader
              title="Sentiment breakdown"
              description="Distribution of positive, neutral, and negative items."
            />
            <SentimentChart data={data.sentimentBreakdown} />
          </Card>

          <Card>
            <CardHeader
              title="Top themes"
              description="Most common themes linked to feedback in this workspace."
            />
            <TopThemesChart data={data.topThemes} />
          </Card>
        </div>
      )}
    </div>
  );
}
