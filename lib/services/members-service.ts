import { prisma } from "@/lib/db";

export async function listWorkspaceMembers(workspaceId: string) {
  return prisma.user.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
