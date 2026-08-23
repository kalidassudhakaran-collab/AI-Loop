import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { listWorkspaceMembers } from "@/lib/services/members-service";
import { handleApiError, ValidationError } from "@/lib/errors";
import { MEMBER_MANAGE_ROLES, requireRole } from "@/lib/permissions";
import { getAuthenticatedUser } from "@/lib/session";
import { createMemberSchema } from "@/lib/validation/members";
import { formatZodError } from "@/lib/validation/format-zod-error";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, MEMBER_MANAGE_ROLES);

    const members = await listWorkspaceMembers(user.workspaceId);

    return Response.json({ members });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, MEMBER_MANAGE_ROLES);

    const body: unknown = await request.json();
    const parsed = createMemberSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const { name, email, password, role } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ValidationError("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const member = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role,
        workspaceId: user.workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return Response.json({ member }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
