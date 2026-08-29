import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { VocReportContent } from "@/lib/validation/reports";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function changeLabel(value: number | null, direction: string): string {
  if (direction === "new") return "New";
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value}%`;
}

const PRIORITY_TONE = {
  high: "danger",
  medium: "warning",
  low: "info",
} as const;

type ReportDocumentProps = {
  title: string;
  generatedByName: string;
  createdAt: string;
  content: VocReportContent;
};

export function ReportDocument({
  title,
  generatedByName,
  createdAt,
  content,
}: ReportDocumentProps) {
  const { stats, narrative, source, model } = content;
  const quoteById = new Map(stats.quotes.map((quote) => [quote.feedbackId, quote]));

  return (
    <article className="report-document space-y-8 text-slate-800">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          LOOP · Voice of Customer
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">
          {formatDate(stats.periodStart)} – {formatDate(stats.periodEnd)} ·
          Generated {formatDate(createdAt)} by {generatedByName}
        </p>
        <p className="text-xs text-slate-400">
          {source === "claude"
            ? `Narrative written by ${model ?? "Claude"} around pre-computed workspace stats.`
            : "Narrative assembled from pre-computed workspace stats (Claude unavailable or unused)."}
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Executive summary</h2>
        <p className="mt-2 leading-relaxed">{narrative.executiveSummary}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Feedback this period" value={String(stats.total)} />
        <StatCard
          label="Volume vs previous"
          value={
            stats.volumeChangePercent === null
              ? stats.previousTotal === 0
                ? "New"
                : "—"
              : `${stats.volumeChangePercent > 0 ? "+" : ""}${stats.volumeChangePercent}%`
          }
        />
        <StatCard
          label="Negative share"
          value={`${stats.sentiment.negativePercent}%`}
          hint={`Was ${stats.sentiment.previousNegativePercent}%`}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Sentiment shift</h2>
        <p className="mt-2 leading-relaxed">{narrative.sentimentNarrative}</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <li>Positive: {stats.sentiment.POS}</li>
          <li>Neutral: {stats.sentiment.NEU}</li>
          <li>Negative: {stats.sentiment.NEG}</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Top themes</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
          {narrative.themeInsights.map((insight) => (
            <li
              key={insight}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              {insight}
            </li>
          ))}
        </ul>
        {stats.topThemes.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Theme
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Current
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Previous
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.topThemes.map((theme) => (
                  <tr key={theme.themeId}>
                    <td className="px-3 py-2">
                      <Link
                        href={`/inbox?themeId=${theme.themeId}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {theme.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{theme.count}</td>
                    <td className="px-3 py-2">{theme.previousCount}</td>
                    <td className="px-3 py-2">
                      {changeLabel(theme.changePercent, theme.direction)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Recommended actions
        </h2>
        <ol className="mt-3 space-y-3">
          {narrative.recommendedActions.map((action) => (
            <li
              key={action.title}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-900">{action.title}</p>
                <Badge tone={PRIORITY_TONE[action.priority]}>
                  {action.priority}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">{action.rationale}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Notable verbatim quotes
        </h2>
        <ul className="mt-3 space-y-3">
          {(narrative.highlightedQuotes.length > 0
            ? narrative.highlightedQuotes
            : stats.quotes.slice(0, 4).map((quote) => ({
                feedbackId: quote.feedbackId,
                whyItMatters: "Verbatim from this period.",
              }))
          ).map((item) => {
            const quote = quoteById.get(item.feedbackId);
            if (!quote) return null;
            return (
              <li
                key={item.feedbackId}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="text-sm italic leading-relaxed text-slate-800">
                  “{quote.content}”
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {quote.customerLabel ?? "Customer"} · {quote.channel} ·{" "}
                  {formatDate(quote.createdAt)}
                  {quote.sentiment ? ` · ${quote.sentiment}` : ""}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.whyItMatters}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {stats.channels.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Channels</h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {stats.channels.map((channel) => (
              <li key={channel.name}>
                <Badge>
                  {channel.name}: {channel.count}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
