import { NextRequest } from "next/server";
import { handleApiError } from "@/lib/errors";
import {
  FEEDBACK_READ_ROLES,
  FEEDBACK_WRITE_ROLES,
  requireRole,
} from "@/lib/permissions";
import {
  createWorkspaceFeedback,
  listWorkspaceFeedback,
} from "@/lib/services/feedback-service";
import { getAuthenticatedUser } from "@/lib/session";
import { createFeedbackSchema } from "@/lib/validation/feedback";
import { formatZodError } from "@/lib/validation/format-zod-error";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const feedback = await listWorkspaceFeedback(user.workspaceId);

    return Response.json({ feedback });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_WRITE_ROLES);

    const body: unknown = await request.json();
    const parsed = createFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const feedback = await createWorkspaceFeedback(
      user.workspaceId,
      parsed.data,
    );

    return Response.json({ feedback }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
