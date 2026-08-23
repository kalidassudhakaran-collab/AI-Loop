import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/errors";
import { MEMBER_MANAGE_ROLES, requireRole } from "@/lib/permissions";
import { getAuthenticatedUser } from "@/lib/session";
import { updateMemberRoleSchema } from "@/lib/validation/members";
import { formatZodError } from "@/lib/validation/format-zod-error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, MEMBER_MANAGE_ROLES);

    const { id } = await context.params;

    if (id === user.id) {
      throw new ValidationError("You cannot change your own role");
    }

    const body: unknown = await request.json();
    const parsed = updateMemberRoleSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const member = await prisma.user.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return Response.json({ member: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, MEMBER_MANAGE_ROLES);

    const { id } = await context.params;

    if (id === user.id) {
      throw new ValidationError("You cannot remove yourself from the workspace");
    }

    const member = await prisma.user.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found");
    }

    await prisma.user.delete({ where: { id } });

    return Response.json({ message: "Member removed" });
  } catch (error) {
    return handleApiError(error);
  }
}
