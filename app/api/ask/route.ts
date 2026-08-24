import { NextRequest } from "next/server";
import { handleApiError, ValidationError } from "@/lib/errors";
import { FEEDBACK_READ_ROLES, requireRole } from "@/lib/permissions";
import { askLoop } from "@/lib/services/ask-loop/ask-loop-service";
import { getAuthenticatedUser } from "@/lib/session";
import { askQuestionSchema } from "@/lib/validation/ask-loop";
import { formatZodError } from "@/lib/validation/format-zod-error";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const body: unknown = await request.json();
    const parsed = askQuestionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const includeDebug =
      process.env.NODE_ENV === "development" ||
      process.env.ASK_LOOP_DEBUG === "true";

    const result = await askLoop({
      workspaceId: user.workspaceId,
      question: parsed.data.question,
      includeDebug,
    });

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
