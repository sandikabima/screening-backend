import { z } from "zod";

export interface RoleResponse {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const getRoleQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  search: z.string().default(""),
});

export const getRoleIdSchema = z.object({
  id: z.string().uuid("Invalid role ID format"),
});

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name must be at least 1 characters")
    .max(50, "Role name must be less than 50 characters"),
  displayName: z
    .string()
    .min(1, "Display name must be at least 1 character")
    .max(100, "Display name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be less than 50 characters")
    .optional(),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type GetRoleInput = z.infer<typeof getRoleQuerySchema>;
