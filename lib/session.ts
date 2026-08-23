import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UnauthorizedError } from "@/lib/errors";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
  workspaceName: string;
};

/**
 * Loads the authenticated user from the session and database.
 * Always use this in API routes instead of trusting client-supplied identity.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      workspaceId: session.user.workspaceId,
    },
    include: { workspace: true },
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId,
    workspaceName: user.workspace.name,
  };
}

export async function getOptionalSession() {
  return getServerSession(authOptions);
}
