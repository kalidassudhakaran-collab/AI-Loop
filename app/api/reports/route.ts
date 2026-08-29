import { NextRequest } from "next/server";
import { handleApiError, ValidationError } from "@/lib/errors";
import {
  FEEDBACK_READ_ROLES,
  REPORT_GENERATE_ROLES,
  requireRole,
} from "@/lib/permissions";
import {
  generateVocReport,
  listWorkspaceReports,
} from "@/lib/services/report-service";
import { getAuthenticatedUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation/format-zod-error";
import { generateReportSchema } from "@/lib/validation/reports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_READ_ROLES);

    const reports = await listWorkspaceReports(user.workspaceId);
    return Response.json({ reports });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(
      user.role,
      REPORT_GENERATE_ROLES,
      "Only admins and analysts can generate reports",
    );

    const body: unknown = await request.json();
    const parsed = generateReportSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const report = await generateVocReport({
      workspaceId: user.workspaceId,
      userId: user.id,
      input: parsed.data,
    });

    return Response.json({ report }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
