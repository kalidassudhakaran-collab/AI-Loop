import { NextRequest } from "next/server";
import { handleApiError, ValidationError } from "@/lib/errors";
import { FEEDBACK_WRITE_ROLES, requireRole } from "@/lib/permissions";
import { importFeedbackCsv } from "@/lib/services/import-service";
import { getAuthenticatedUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    requireRole(user.role, FEEDBACK_WRITE_ROLES);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ValidationError("CSV file is required");
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      throw new ValidationError("Only .csv files are supported");
    }

    if (file.size === 0) {
      throw new ValidationError("CSV file is empty");
    }

    if (file.size > 2_000_000) {
      throw new ValidationError("CSV file must be under 2MB");
    }

    const csvText = await file.text();
    const result = await importFeedbackCsv(user.workspaceId, csvText);

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
