import { handleApiError } from "@/lib/errors";
import { FEEDBACK_WRITE_ROLES, requireRole } from "@/lib/permissions";
import { simulateSupportTicketChannel } from "@/lib/services/simulate-service";
import { getAuthenticatedUser } from "@/lib/session";

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_WRITE_ROLES);

    const result = await simulateSupportTicketChannel(user.workspaceId);

    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
