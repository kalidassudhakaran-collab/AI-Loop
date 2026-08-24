import { NextRequest } from "next/server";
import { handleApiError, ValidationError } from "@/lib/errors";
import { THEME_WRITE_ROLES, requireRole } from "@/lib/permissions";
import {
  deleteWorkspaceTheme,
  updateWorkspaceTheme,
} from "@/lib/services/theme-service";
import { getAuthenticatedUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation/format-zod-error";
import { updateThemeSchema } from "@/lib/validation/themes";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, THEME_WRITE_ROLES);

    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = updateThemeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const theme = await updateWorkspaceTheme(
      user.workspaceId,
      id,
      parsed.data,
    );

    return Response.json({ theme });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, THEME_WRITE_ROLES);

    const { id } = await context.params;
    await deleteWorkspaceTheme(user.workspaceId, id);

    return Response.json({ message: "Theme deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
