import { NextRequest } from "next/server";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  FEEDBACK_READ_ROLES,
  FEEDBACK_WRITE_ROLES,
  requireRole,
} from "@/lib/permissions";
import {
  getWorkspaceFeedbackById,
  updateWorkspaceFeedbackStatus,
} from "@/lib/services/feedback-service";
import { getAuthenticatedUser } from "@/lib/session";
import { updateFeedbackStatusSchema } from "@/lib/validation/feedback";
import { formatZodError } from "@/lib/validation/format-zod-error";

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_WRITE_ROLES);

    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = updateFeedbackStatusSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const feedback = await updateWorkspaceFeedbackStatus(
      user.workspaceId,
      id,
      parsed.data.status,
    );

    if (!feedback) {
      throw new NotFoundError("Feedback not found");
    }

    return Response.json({ feedback });
  } catch (error) {
    return handleApiError(error);
  }
}
