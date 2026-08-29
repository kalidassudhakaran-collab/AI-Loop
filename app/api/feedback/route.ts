import { NextRequest } from "next/server";
import { handleApiError, ValidationError } from "@/lib/errors";
import {
  FEEDBACK_READ_ROLES,
  FEEDBACK_WRITE_ROLES,
  requireRole,
} from "@/lib/permissions";
import { classifyOnIngest } from "@/lib/services/ai/queue-classification";
import {
  createWorkspaceFeedback,
  listWorkspaceChannels,
  listWorkspaceThemes,
  queryWorkspaceFeedback,
} from "@/lib/services/feedback-service";
import { getAuthenticatedUser } from "@/lib/session";
import { createFeedbackSchema, feedbackQuerySchema } from "@/lib/validation/feedback";
import { formatZodError } from "@/lib/validation/format-zod-error";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = feedbackQuerySchema.safeParse(params);

    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    let result;
    try {
      result = await queryWorkspaceFeedback(user.workspaceId, parsed.data);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("invalid")) {
        throw new ValidationError(error.message);
      }
      throw error;
    }

    const [themes, channels] = await Promise.all([
      listWorkspaceThemes(user.workspaceId),
      listWorkspaceChannels(user.workspaceId),
    ]);

    return Response.json({
      items: result.items,
      pagination: result.pagination,
      meta: { themes, channels },
    });
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

    const classification = await classifyOnIngest(
      user.workspaceId,
      feedback.id,
    );

    return Response.json({ feedback, classification }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
