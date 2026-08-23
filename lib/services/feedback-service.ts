import { prisma } from "@/lib/db";
import type { CreateFeedbackInput } from "@/lib/validation/feedback";

export async function listWorkspaceFeedback(workspaceId: string) {
  return prisma.feedback.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
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

export async function getWorkspaceStats(workspaceId: string) {
  const [total, newCount, negativeCount] = await Promise.all([
    prisma.feedback.count({ where: { workspaceId } }),
    prisma.feedback.count({ where: { workspaceId, status: "NEW" } }),
    prisma.feedback.count({ where: { workspaceId, sentiment: "NEG" } }),
  ]);

  const negativePercent =
    total === 0 ? 0 : Math.round((negativeCount / total) * 100);

  return { total, newCount, negativePercent };
}
