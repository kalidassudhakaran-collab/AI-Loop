import { handleApiError } from "@/lib/errors";
import { AI_CLASSIFY_ROLES, requireRole } from "@/lib/permissions";
import { classifyAndSaveFeedback } from "@/lib/services/ai/classify-and-save";
import { getAuthenticatedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(
      user.role,
      AI_CLASSIFY_ROLES,
      "Only admins and analysts can classify feedback",
    );

    const { id } = await context.params;
    const classification = await classifyAndSaveFeedback(
      user.workspaceId,
      id,
    );

    return Response.json({ classification });
  } catch (error) {
    return handleApiError(error);
  }
}
