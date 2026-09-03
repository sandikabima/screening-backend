import { z } from "zod";

export interface FacultyResponse {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacultyPublicResponse {
  id: string;
  code: string;
  name: string;
}

export const getFacultyQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  search: z.string().default(""),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? val === "true" : undefined)),
});

export const getFacultyIdSchema = z.object({
  id: z.string().uuid("Invalid faculty ID format"),
});

export const createFacultySchema = z.object({
  code: z
    .string()
    .min(2, "Faculty code must be at least 2 characters")
    .max(20, "Faculty code must be less than 20 characters")
    .transform((val) => val.toUpperCase().trim()),
  name: z
    .string()
    .min(3, "Faculty name must be at least 3 characters")
    .max(150, "Faculty name must be less than 150 characters")
    .transform((val) => val.trim()),
});

export const updateFacultySchema = z.object({
  code: z
    .string()
    .min(2, "Faculty code must be at least 2 characters")
    .max(20, "Faculty code must be less than 20 characters")
    .transform((val) => val.toUpperCase().trim())
    .optional(),
  name: z
    .string()
    .min(3, "Faculty name must be at least 3 characters")
    .max(150, "Faculty name must be less than 150 characters")
    .transform((val) => val.trim())
    .optional(),
});

export const toggleFacultyStatusSchema = z.object({
  isActive: z.boolean({ message: "isActive status is required" }),
});

export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
export type ToggleFacultyStatusInput = z.infer<
  typeof toggleFacultyStatusSchema
>;
export type GetFacultyQueryInput = z.infer<typeof getFacultyQuerySchema>;
export type GetFacultyIdInput = z.infer<typeof getFacultyIdSchema>;
