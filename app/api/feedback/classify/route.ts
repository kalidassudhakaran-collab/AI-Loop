import { NextRequest } from "next/server";
import { handleApiError, ValidationError } from "@/lib/errors";
import { AI_CLASSIFY_ROLES, requireRole } from "@/lib/permissions";
import { classifyFeedbackBatch } from "@/lib/services/ai/classify-and-save";
import { getAuthenticatedUser } from "@/lib/session";
import { batchClassifySchema } from "@/lib/validation/classification";
import { formatZodError } from "@/lib/validation/format-zod-error";

export const dynamic = "force-dynamic";

/**
 * Explicit batch classification — never runs on page load.
 * Max 10 IDs, concurrency capped server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(
      user.role,
      AI_CLASSIFY_ROLES,
      "Only admins and analysts can classify feedback",
    );

    const body: unknown = await request.json();
    const parsed = batchClassifySchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const batch = await classifyFeedbackBatch(
      user.workspaceId,
      parsed.data.feedbackIds,
      2,
    );

    return Response.json(batch);
  } catch (error) {
    return handleApiError(error);
  }
}
