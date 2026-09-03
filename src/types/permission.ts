import { z } from "zod";

export interface PermissionResponse {
  id: string;
  permissionKey: string;
  name: string;
  modul: string;
  createdAt: Date;
}

export interface PermissionCatalogItem {
  id: string;
  permissionKey: string;
  name: string;
  module: string;
  createdAt: Date;
}

export interface PermissionSummary {
  id: string;
  permissionKey: string;
  name: string;
  module: string;
}

export interface PermissionListResponse {
  permissions: PermissionCatalogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoleWithPermissionsResponse {
  roleId: string;
  roleName: string;
  permissions: PermissionSummary[];
}

export const permissionQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((value) => Number(value)),
  limit: z
    .string()
    .default("20")
    .transform((value) => Number(value)),
  search: z.string().default(""),
});

export const getRolePermissionParamsSchema = z.object({
  roleId: z.string().uuid("Format Role ID tidak valid"),
});

export const getPermissionIdSchema = z.object({
  id: z.string().uuid("Format Permission ID tidak valid"),
});

export const createPermissionSchema = z.object({
  permissionKey: z
    .string()
    .trim()
    .min(2, "Permission key minimal 2 karakter")
    .max(100, "Permission key maksimal 100 karakter")
    .regex(
      /^[a-z0-9:_-]+$/i,
      "Permission key hanya boleh huruf, angka, titik dua, garis bawah, atau strip",
    ),
  name: z
    .string()
    .trim()
    .min(2, "Nama permission minimal 2 karakter")
    .max(100, "Nama permission maksimal 100 karakter"),
  module: z
    .string()
    .trim()
    .min(2, "Nama modul minimal 2 karakter")
    .max(50, "Nama modul maksimal 50 karakter"),
});

export const updatePermissionSchema = createPermissionSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Minimal satu field harus diisi untuk pembaruan",
  });

export const assignPermissionsSchema = z.object({
  roleId: z.string().uuid("Format Role ID tidak valid"),
  permissionIds: z.array(z.string().uuid("Format Permission ID tidak valid")),
});

export type PermissionQueryInput = z.infer<typeof permissionQuerySchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
