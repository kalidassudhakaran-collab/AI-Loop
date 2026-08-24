import { NextRequest } from "next/server";
import { handleApiError, ValidationError } from "@/lib/errors";
import { FEEDBACK_READ_ROLES, requireRole } from "@/lib/permissions";
import {
  getThemeTrends,
  getThemeVolumeSeries,
} from "@/lib/services/theme-trend-service";
import { getAuthenticatedUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation/format-zod-error";
import { themeTrendQuerySchema } from "@/lib/validation/themes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = themeTrendQuerySchema.safeParse(params);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const query = {
      from: parsed.data.from || undefined,
      to: parsed.data.to || undefined,
      themeId: parsed.data.themeId || undefined,
      windowDays: parsed.data.windowDays,
    };

    let trends;
    let series;
    try {
      [trends, series] = await Promise.all([
        getThemeTrends(user.workspaceId, query),
        getThemeVolumeSeries(user.workspaceId, query),
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("invalid")) {
        throw new ValidationError(error.message);
      }
      throw error;
    }

    return Response.json({
      ...trends,
      series,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
