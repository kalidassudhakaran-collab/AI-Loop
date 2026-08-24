import { NextRequest } from "next/server";
import { handleApiError, ValidationError } from "@/lib/errors";
import {
  EMBEDDING_WRITE_ROLES,
  FEEDBACK_READ_ROLES,
  requireRole,
} from "@/lib/permissions";
import {
  embedFeedbackBatch,
  getWorkspaceEmbeddingStats,
} from "@/lib/services/embedding-service";
import { getAuthenticatedUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation/format-zod-error";
import { batchEmbedSchema } from "@/lib/validation/themes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const stats = await getWorkspaceEmbeddingStats(user.workspaceId);
    return Response.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(
      user.role,
      EMBEDDING_WRITE_ROLES,
      "Only admins and analysts can generate embeddings",
    );

    const body: unknown = await request.json();
    const parsed = batchEmbedSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const batch = await embedFeedbackBatch(
      user.workspaceId,
      parsed.data.feedbackIds,
      2,
    );

    return Response.json(batch);
  } catch (error) {
    return handleApiError(error);
  }
}
