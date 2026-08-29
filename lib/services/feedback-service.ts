import {
  FeedbackStatus,
  Prisma,
  Sentiment,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  CreateFeedbackInput,
  FeedbackQueryInput,
} from "@/lib/validation/feedback";
import { parseOptionalDate, toEndOfDay } from "@/lib/validation/feedback";

export type FeedbackWithThemes = Prisma.FeedbackGetPayload<{
  include: {
    themes: {
      include: {
        theme: true;
      };
    };
  };
}>;

export type FeedbackListResult = {
  items: FeedbackWithThemes[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function buildFeedbackWhere(
  workspaceId: string,
  filters: FeedbackQueryInput,
): Prisma.FeedbackWhereInput {
  const where: Prisma.FeedbackWhereInput = {
    workspaceId,
  };

  const query = filters.q.trim();
  if (query) {
    where.content = {
      contains: query,
      mode: "insensitive",
    };
  }

  if (filters.channel) {
    where.channel = filters.channel;
  }

  if (filters.sentiment) {
    where.sentiment = filters.sentiment as Sentiment;
  }

  if (filters.status) {
    where.status = filters.status as FeedbackStatus;
  }

  if (filters.themeId) {
    where.themes = {
      some: {
        themeId: filters.themeId,
      },
    };
  }

  const fromDate = parseOptionalDate(filters.from, "from date");
  const toDate = parseOptionalDate(filters.to, "to date");

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) {
      where.createdAt.gte = fromDate;
    }
    if (toDate) {
      where.createdAt.lte = toEndOfDay(toDate);
    }
  }

  return where;
}

/** M1-compatible full list (kept for simple callers). */
export async function listWorkspaceFeedback(workspaceId: string) {
  return prisma.feedback.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function queryWorkspaceFeedback(
  workspaceId: string,
  filters: FeedbackQueryInput,
): Promise<FeedbackListResult> {
  const where = buildFeedbackWhere(workspaceId, filters);
  const skip = (filters.page - 1) * filters.pageSize;

  const [total, items] = await Promise.all([
    prisma.feedback.count({ where }),
    prisma.feedback.findMany({
      where,
      include: {
        themes: {
          include: {
            theme: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: filters.pageSize,
    }),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
  };
}

export async function getWorkspaceFeedbackById(
  workspaceId: string,
  feedbackId: string,
) {
  return prisma.feedback.findFirst({
    where: {
      id: feedbackId,
      workspaceId,
    },
  });
}

export async function createWorkspaceFeedback(
  workspaceId: string,
  input: CreateFeedbackInput,
) {
  return prisma.feedback.create({
    data: {
      content: input.content,
      channel: input.channel,
      sourceRef: input.sourceRef ?? null,
      customerLabel: input.customerLabel ?? null,
      status: "NEW",
      workspaceId,
    },
  });
}

export async function updateWorkspaceFeedbackStatus(
  workspaceId: string,
  feedbackId: string,
  status: FeedbackStatus,
) {
  const existing = await prisma.feedback.findFirst({
    where: {
      id: feedbackId,
      workspaceId,
    },
  });

  if (!existing) {
    return null;
  }

  return prisma.feedback.update({
    where: { id: feedbackId },
    data: { status },
  });
}

export type BulkFeedbackCreateInput = {
  content: string;
  channel: string;
  customerLabel?: string | null;
  sourceRef?: string | null;
  createdAt?: Date;
  sentiment?: Sentiment | null;
  sentimentScore?: number | null;
  status?: FeedbackStatus;
};

export async function createManyWorkspaceFeedback(
  workspaceId: string,
  rows: BulkFeedbackCreateInput[],
) {
  if (rows.length === 0) {
    return { count: 0, ids: [] as string[] };
  }

  const created = await prisma.feedback.createManyAndReturn({
    data: rows.map((row) => ({
      content: row.content,
      channel: row.channel,
      customerLabel: row.customerLabel ?? null,
      sourceRef: row.sourceRef ?? null,
      createdAt: row.createdAt ?? new Date(),
      sentiment: row.sentiment ?? null,
      sentimentScore: row.sentimentScore ?? null,
      status: row.status ?? "NEW",
      workspaceId,
    })),
    select: { id: true },
  });

  return {
    count: created.length,
    ids: created.map((row) => row.id),
  };
}

export async function listWorkspaceThemes(workspaceId: string) {
  return prisma.theme.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });
}

export async function listWorkspaceChannels(workspaceId: string) {
  const rows = await prisma.feedback.findMany({
    where: { workspaceId },
    distinct: ["channel"],
    select: { channel: true },
    orderBy: { channel: "asc" },
  });

  return rows.map((row) => row.channel);
}

/** Legacy M1 stats helper — still used where date filters are not needed. */
export async function getWorkspaceStats(workspaceId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [total, newThisWeek, negativeCount] = await Promise.all([
    prisma.feedback.count({ where: { workspaceId } }),
    prisma.feedback.count({
      where: { workspaceId, createdAt: { gte: weekAgo } },
    }),
    prisma.feedback.count({ where: { workspaceId, sentiment: "NEG" } }),
  ]);

  const negativePercent =
    total === 0 ? 0 : Math.round((negativeCount / total) * 100);

  return { total, newCount: newThisWeek, negativePercent };
}
