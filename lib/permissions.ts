import { Role } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";

export const ROLES = {
  ADMIN: "ADMIN",
  ANALYST: "ANALYST",
  VIEWER: "VIEWER",
} as const;

/** Roles allowed to create or update feedback. */
export const FEEDBACK_WRITE_ROLES: Role[] = [Role.ADMIN, Role.ANALYST];

/** Roles allowed to read feedback. */
export const FEEDBACK_READ_ROLES: Role[] = [
  Role.ADMIN,
  Role.ANALYST,
  Role.VIEWER,
];

/** Roles allowed to manage workspace members. */
export const MEMBER_MANAGE_ROLES: Role[] = [Role.ADMIN];

/** Roles allowed to trigger AI classification. */
export const AI_CLASSIFY_ROLES: Role[] = [Role.ADMIN, Role.ANALYST];

export function hasRole(userRole: Role, allowedRoles: readonly Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function requireRole(
  userRole: Role,
  allowedRoles: readonly Role[],
  message?: string,
): void {
  if (!hasRole(userRole, allowedRoles)) {
    throw new ForbiddenError(message);
  }
}
