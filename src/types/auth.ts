import { z } from "zod";

export enum AuthRole {
  ADMIN = "ADMIN",
  TESTER = "TESTER",
  USER = "USER",
}

export interface Auth {
  id: string;
  email: string;
  name?: string | null;
  displayName?: string;
  password?: string;
  roleId?: string;
  role: AuthRole;
  permissions: string[];
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 character")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 character")
    .max(100, "Password must be less than 100 character"),
  role: z.nativeEnum(AuthRole).optional().default(AuthRole.USER),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  roleId: z.string().uuid("Format Role ID harus UUID valid").optional(),
  isActive: z.boolean().optional(),
});

export const getUsersQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  search: z.string().default(""),
  roleId: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
});

export const getUserIdSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

export const updateStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .required({
    isActive: true,
  })
  .superRefine((data, ctx) => {
    if (typeof data.isActive !== "boolean") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "isActive must be a boolean (true or false)",
        path: ["isActive"],
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersInput = z.infer<typeof getUsersQuerySchema>;
export type GetUserById = z.infer<typeof getUserIdSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export type AuthWithoutResponse = Omit<Auth, "password">;

export interface AuthResponse {
  auth: AuthWithoutResponse;
  token: string;
  refreshToken?: string;
}
