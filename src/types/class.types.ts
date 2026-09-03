import { z } from "zod";

// ==========================================
// INTERFACES & RESPONSES
// ==========================================

export interface ClassResponse {
  id: string;
  studyProgramId: string;
  cohortId: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  studyProgram?: {
    id: string;
    code: string;
    name: string;
    degree: string;
  };
  cohort?: {
    id: string;
    year: number;
    name: string;
  };
}

export interface ClassPublicResponse {
  id: string;
  studyProgramId: string;
  cohortId: string;
  code: string;
  name: string;
  studyProgramName: string;
  cohortYear: number;
}

// ==========================================
// ZOD SCHEMAS
// ==========================================

export const getClassQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  search: z.string().default(""),
  studyProgramId: z.string().uuid("Invalid study program ID format").optional(),
  cohortId: z.string().uuid("Invalid cohort ID format").optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? val === "true" : undefined)),
});

export const getClassIdSchema = z.object({
  id: z.string().uuid("Invalid class ID format"),
});

export const createClassSchema = z.object({
  studyProgramId: z.string().uuid("Invalid study program ID format"),
  cohortId: z.string().uuid("Invalid cohort ID format"),
  code: z
    .string({ message: "Class code is required" })
    .min(2, "Class code must be at least 2 characters")
    .max(20, "Class code must be less than 20 characters")
    .transform((val) => val.toUpperCase().trim()),
  name: z
    .string({ message: "Class name is required" })
    .min(2, "Class name must be at least 2 characters")
    .max(100, "Class name must be less than 100 characters")
    .transform((val) => val.trim()),
});

export const updateClassSchema = z.object({
  studyProgramId: z.string().uuid("Invalid study program ID format").optional(),
  cohortId: z.string().uuid("Invalid cohort ID format").optional(),
  code: z
    .string()
    .min(2, "Class code must be at least 2 characters")
    .max(20, "Class code must be less than 20 characters")
    .transform((val) => val.toUpperCase().trim())
    .optional(),
  name: z
    .string()
    .min(2, "Class name must be at least 2 characters")
    .max(100, "Class name must be less than 100 characters")
    .transform((val) => val.trim())
    .optional(),
});

export const toggleClassStatusSchema = z.object({
  isActive: z.boolean({ message: "isActive status is required" }),
});

// ==========================================
// INFERRED TYPES
// ==========================================

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ToggleClassStatusInput = z.infer<typeof toggleClassStatusSchema>;
export type GetClassQueryInput = z.infer<typeof getClassQuerySchema>;
