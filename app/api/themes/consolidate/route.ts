import { handleApiError } from "@/lib/errors";
import { THEME_WRITE_ROLES, requireRole } from "@/lib/permissions";
import { consolidateWorkspaceThemes } from "@/lib/services/theme-service";
import { getAuthenticatedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Deterministic theme clustering / consolidation for the current workspace.
 */
export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, THEME_WRITE_ROLES);

    const result = await consolidateWorkspaceThemes(user.workspaceId);
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
