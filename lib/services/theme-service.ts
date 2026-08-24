import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  normalizeThemeName,
  resolveCanonicalThemeName,
} from "@/lib/themes/normalize";

const THEME_COLORS = [
  "#6366f1",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#0ea5e9",
  "#14b8a6",
  "#f97316",
];

type Tx = Prisma.TransactionClient;

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return THEME_COLORS[Math.abs(hash) % THEME_COLORS.length];
}

export async function listWorkspaceThemesWithCounts(workspaceId: string) {
  const themes = await prisma.theme.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: { feedback: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return themes.map((theme) => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    color: theme.color,
    feedbackCount: theme._count.feedback,
    // Theme model has no createdAt in schema — omit rather than invent
  }));
}

/**
 * Find or create a canonical theme inside one workspace.
 */
export async function findOrCreateCanonicalTheme(
  workspaceId: string,
  rawName: string,
  tx: Tx = prisma,
) {
  const existing = await tx.theme.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
  });

  const canonicalName = resolveCanonicalThemeName(
    rawName,
    existing.map((theme) => theme.name),
  );

  const found = existing.find(
    (theme) => theme.name.toLowerCase() === canonicalName.toLowerCase(),
  );
  if (found) {
    return tx.theme.findUniqueOrThrow({ where: { id: found.id } });
  }

  return tx.theme.create({
    data: {
      name: canonicalName,
      description: "Canonical theme",
      color: colorForName(canonicalName),
      workspaceId,
    },
  });
}

export type ThemeAssignmentInput = {
  name: string;
  confidence: number;
};

/**
 * Replace theme links for one feedback item using normalized theme names.
 */
export async function assignThemesToFeedback(
  workspaceId: string,
  feedbackId: string,
  themes: ThemeAssignmentInput[],
  tx?: Tx,
) {
  const run = async (client: Tx) => {
    const feedback = await client.feedback.findFirst({
      where: { id: feedbackId, workspaceId },
      select: { id: true },
    });

    if (!feedback) {
      throw new NotFoundError("Feedback not found");
    }

    await client.feedbackTheme.deleteMany({
      where: { feedbackId },
    });

    const assigned: Array<{ name: string; confidence: number; themeId: string }> =
      [];
    const seen = new Set<string>();

    for (const input of themes) {
      const theme = await findOrCreateCanonicalTheme(
        workspaceId,
        input.name,
        client,
      );

      if (seen.has(theme.id)) {
        continue;
      }
      seen.add(theme.id);

      const confidence = Math.min(1, Math.max(0, input.confidence));

      await client.feedbackTheme.create({
        data: {
          feedbackId,
          themeId: theme.id,
          confidence,
        },
      });

      assigned.push({
        name: theme.name,
        confidence,
        themeId: theme.id,
      });
    }

    return assigned;
  };

  if (tx) {
    return run(tx);
  }

  return prisma.$transaction((client) => run(client));
}

export type ConsolidateResult = {
  mergedGroups: number;
  themesRemoved: number;
  linksReassigned: number;
};

/**
 * Deterministic clustering: normalize every theme name and merge duplicates
 * within a single workspace. Never crosses workspaces.
 */
export async function consolidateWorkspaceThemes(
  workspaceId: string,
): Promise<ConsolidateResult> {
  return prisma.$transaction(async (tx) => {
    const themes = await tx.theme.findMany({
      where: { workspaceId },
      include: {
        feedback: true,
      },
    });

    const groups = new Map<string, typeof themes>();

    for (const theme of themes) {
      const key = normalizeThemeName(theme.name).toLowerCase();
      const list = groups.get(key) ?? [];
      list.push(theme);
      groups.set(key, list);
    }

    let mergedGroups = 0;
    let themesRemoved = 0;
    let linksReassigned = 0;

    for (const [, group] of Array.from(groups.entries())) {
      if (group.length === 0) continue;

      const canonicalLabel = normalizeThemeName(group[0].name);

      // Prefer an existing theme that already has the canonical name.
      let survivor =
        group.find(
          (theme) => theme.name.toLowerCase() === canonicalLabel.toLowerCase(),
        ) ?? group[0];

      if (survivor.name !== canonicalLabel) {
        // Rename survivor if the canonical name is free.
        const conflict = await tx.theme.findFirst({
          where: {
            workspaceId,
            name: canonicalLabel,
            NOT: { id: survivor.id },
          },
        });
        if (!conflict) {
          survivor = await tx.theme.update({
            where: { id: survivor.id },
            data: { name: canonicalLabel },
            include: { feedback: true },
          });
        }
      }

      if (group.length > 1) {
        mergedGroups += 1;
      }

      for (const duplicate of group) {
        if (duplicate.id === survivor.id) continue;

        for (const link of duplicate.feedback) {
          const existing = await tx.feedbackTheme.findUnique({
            where: {
              feedbackId_themeId: {
                feedbackId: link.feedbackId,
                themeId: survivor.id,
              },
            },
          });

          if (existing) {
            // Keep the higher confidence, drop the duplicate link.
            if (link.confidence > existing.confidence) {
              await tx.feedbackTheme.update({
                where: {
                  feedbackId_themeId: {
                    feedbackId: link.feedbackId,
                    themeId: survivor.id,
                  },
                },
                data: { confidence: link.confidence },
              });
            }
            await tx.feedbackTheme.delete({
              where: {
                feedbackId_themeId: {
                  feedbackId: link.feedbackId,
                  themeId: duplicate.id,
                },
              },
            });
          } else {
            await tx.feedbackTheme.update({
              where: {
                feedbackId_themeId: {
                  feedbackId: link.feedbackId,
                  themeId: duplicate.id,
                },
              },
              data: { themeId: survivor.id },
            });
            linksReassigned += 1;
          }
        }

        await tx.theme.delete({ where: { id: duplicate.id } });
        themesRemoved += 1;
      }
    }

    return { mergedGroups, themesRemoved, linksReassigned };
  });
}

export async function updateWorkspaceTheme(
  workspaceId: string,
  themeId: string,
  data: { name?: string; description?: string | null },
) {
  const theme = await prisma.theme.findFirst({
    where: { id: themeId, workspaceId },
  });

  if (!theme) {
    throw new NotFoundError("Theme not found");
  }

  let nextName = theme.name;
  if (data.name !== undefined) {
    nextName = normalizeThemeName(data.name);
    const clash = await prisma.theme.findFirst({
      where: {
        workspaceId,
        name: nextName,
        NOT: { id: themeId },
      },
    });
    if (clash) {
      throw new ValidationError(
        `A theme named "${nextName}" already exists in this workspace`,
      );
    }
  }

  return prisma.theme.update({
    where: { id: themeId },
    data: {
      name: nextName,
      description:
        data.description === undefined ? theme.description : data.description,
    },
  });
}

export async function deleteWorkspaceTheme(
  workspaceId: string,
  themeId: string,
) {
  const theme = await prisma.theme.findFirst({
    where: { id: themeId, workspaceId },
  });

  if (!theme) {
    throw new NotFoundError("Theme not found");
  }

  await prisma.$transaction([
    prisma.feedbackTheme.deleteMany({ where: { themeId } }),
    prisma.theme.delete({ where: { id: themeId } }),
  ]);
}
