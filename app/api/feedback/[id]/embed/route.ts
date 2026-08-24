import { handleApiError } from "@/lib/errors";
import { EMBEDDING_WRITE_ROLES, requireRole } from "@/lib/permissions";
import { embedAndStoreFeedback } from "@/lib/services/embedding-service";
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
      EMBEDDING_WRITE_ROLES,
      "Only admins and analysts can generate embeddings",
    );

    const { id } = await context.params;
    const result = await embedAndStoreFeedback(user.workspaceId, id);
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
