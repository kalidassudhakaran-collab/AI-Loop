import Link from "next/link";
import { ThemesActions } from "@/components/themes/ThemesActions";
import { EmbeddingPanel } from "@/components/themes/EmbeddingPanel";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { prisma } from "@/lib/db";
import {
  EMBEDDING_WRITE_ROLES,
  THEME_WRITE_ROLES,
  hasRole,
} from "@/lib/permissions";
import { getWorkspaceEmbeddingStats } from "@/lib/services/embedding-service";
import { listWorkspaceThemesWithCounts } from "@/lib/services/theme-service";
import { getAuthenticatedUser } from "@/lib/session";

export default async function ThemesPage() {
  const user = await getAuthenticatedUser();
  const canManage = hasRole(user.role, THEME_WRITE_ROLES);
  const canEmbed = hasRole(user.role, EMBEDDING_WRITE_ROLES);

  const [themes, embeddingStats, recentFeedback] = await Promise.all([
    listWorkspaceThemesWithCounts(user.workspaceId),
    getWorkspaceEmbeddingStats(user.workspaceId),
    prisma.feedback.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const sampleFeedbackIds = recentFeedback.map((item) => item.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Themes</h2>
        <p className="mt-1 text-sm text-slate-500">
          Canonical themes for {user.workspaceName}. Counts come from
          FeedbackTheme links.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Theme clustering"
          description="Normalize aliases and merge duplicates without calling Claude."
        />
        <ThemesActions canManage={canManage} />
      </Card>

      <Card>
        <CardHeader
          title="Embedding infrastructure"
          description="Prepare semantic retrieval for Ask LOOP (M3-C). Optional Ollama provider — never uses fake vectors."
        />
        <EmbeddingPanel
          canEmbed={canEmbed}
          stats={embeddingStats}
          sampleFeedbackIds={sampleFeedbackIds}
        />
      </Card>

      <Card>
        <CardHeader
          title={`Workspace themes (${themes.length})`}
          description="All themes are scoped to your workspace."
        />
        {themes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No themes yet. Seed data, classify feedback, or create themes after
            consolidation.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Theme
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {themes.map((theme) => (
                  <tr key={theme.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: theme.color }}
                        />
                        <Link
                          href={`/inbox?themeId=${theme.id}`}
                          className="font-medium text-indigo-700 hover:underline"
                        >
                          {theme.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {theme.description ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="info">{theme.feedbackCount}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
