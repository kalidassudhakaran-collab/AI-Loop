import { NextRequest } from "next/server";
import { handleApiError, ValidationError } from "@/lib/errors";
import { FEEDBACK_READ_ROLES, requireRole } from "@/lib/permissions";
import { getDashboardData } from "@/lib/services/dashboard-service";
import { getAuthenticatedUser } from "@/lib/session";
import { dashboardQuerySchema } from "@/lib/validation/feedback";
import { formatZodError } from "@/lib/validation/format-zod-error";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = dashboardQuerySchema.safeParse(params);

    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    let data;
    try {
      data = await getDashboardData(user.workspaceId, parsed.data);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("invalid")) {
        throw new ValidationError(error.message);
      }
      throw error;
    }

    return Response.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
