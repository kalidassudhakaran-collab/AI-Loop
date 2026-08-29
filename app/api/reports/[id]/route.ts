import { handleApiError } from "@/lib/errors";
import { FEEDBACK_READ_ROLES, requireRole } from "@/lib/permissions";
import { getWorkspaceReport } from "@/lib/services/report-service";
import { getAuthenticatedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const report = await getWorkspaceReport(user.workspaceId, context.params.id);
    return Response.json({ report });
  } catch (error) {
    return handleApiError(error);
  }
}
