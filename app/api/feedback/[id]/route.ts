import { NextRequest } from "next/server";
import { handleApiError, NotFoundError } from "@/lib/errors";
import { FEEDBACK_READ_ROLES, requireRole } from "@/lib/permissions";
import { getWorkspaceFeedbackById } from "@/lib/services/feedback-service";
import { getAuthenticatedUser } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const { id } = await context.params;

    const feedback = await getWorkspaceFeedbackById(user.workspaceId, id);

    if (!feedback) {
      throw new NotFoundError("Feedback not found");
    }

    return Response.json({ feedback });
  } catch (error) {
    return handleApiError(error);
  }
}
