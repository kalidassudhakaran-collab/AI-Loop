import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, ValidationError } from "@/lib/errors";
import {
  FEEDBACK_READ_ROLES,
  THEME_WRITE_ROLES,
  requireRole,
} from "@/lib/permissions";
import {
  findOrCreateCanonicalTheme,
  listWorkspaceThemesWithCounts,
} from "@/lib/services/theme-service";
import { getAuthenticatedUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation/format-zod-error";
import { createThemeSchema } from "@/lib/validation/themes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const themes = await listWorkspaceThemesWithCounts(user.workspaceId);
    return Response.json({ themes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, THEME_WRITE_ROLES);

    const body: unknown = await request.json();
    const parsed = createThemeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const theme = await findOrCreateCanonicalTheme(
      user.workspaceId,
      parsed.data.name,
    );

    const updated =
      parsed.data.description !== undefined
        ? await prisma.theme.update({
            where: { id: theme.id },
            data: { description: parsed.data.description },
          })
        : theme;

    return Response.json({ theme: updated }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
