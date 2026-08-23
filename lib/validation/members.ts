import { Role } from "@prisma/client";
import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(Role),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
