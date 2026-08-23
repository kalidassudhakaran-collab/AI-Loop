import type { ZodError } from "zod";

export function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join(", ");
}
