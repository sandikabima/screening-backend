import { z } from "zod";

// ==========================================
// INTERFACES & RESPONSES
// ==========================================

export interface StudyProgramResponse {
  id: string;
  facultyId: string;
  code: string;
  name: string;
  degree: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  faculty?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface StudyProgramPublicResponse {
  id: string;
  facultyId: string;
  code: string;
  name: string;
  degree: string;
  facultyName: string;
}

// ==========================================
// ZOD SCHEMAS
// ==========================================

export const getStudyProgramQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  search: z.string().default(""),
  facultyId: z.string().uuid("Invalid faculty ID format").optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? val === "true" : undefined)),
});

export const getStudyProgramIdSchema = z.object({
  id: z.string().uuid("Invalid study program ID format"),
});

export const createStudyProgramSchema = z.object({
  facultyId: z.string().uuid("Invalid faculty ID format"),
  code: z
    .string()
    .min(2, "Study program code must be at least 2 characters")
    .max(20, "Study program code must be less than 20 characters")
    .transform((val) => val.toUpperCase().trim()),
  name: z
    .string()
    .min(3, "Study program name must be at least 3 characters")
    .max(150, "Study program name must be less than 150 characters")
    .transform((val) => val.trim()),
  degree: z.enum(["D3", "D4", "S1", "S2", "S3"], {
    message: "Degree must be D3, D4, S1, S2, or S3",
  }),
});

export const updateStudyProgramSchema = z.object({
  facultyId: z.string().uuid("Invalid faculty ID format").optional(),
  code: z
    .string()
    .min(2, "Study program code must be at least 2 characters")
    .max(20, "Study program code must be less than 20 characters")
    .transform((val) => val.toUpperCase().trim())
    .optional(),
  name: z
    .string()
    .min(3, "Study program name must be at least 3 characters")
    .max(150, "Study program name must be less than 150 characters")
    .transform((val) => val.trim())
    .optional(),
  degree: z.enum(["D3", "D4", "S1", "S2", "S3"]).optional(),
});

export const toggleStudyProgramStatusSchema = z.object({
  isActive: z.boolean({ message: "isActive status is required" }),
});

// ==========================================
// INFERRED TYPES
// ==========================================

export type CreateStudyProgramInput = z.infer<typeof createStudyProgramSchema>;
export type UpdateStudyProgramInput = z.infer<typeof updateStudyProgramSchema>;
export type ToggleStudyProgramStatusInput = z.infer<
  typeof toggleStudyProgramStatusSchema
>;
export type GetStudyProgramQueryInput = z.infer<
  typeof getStudyProgramQuerySchema
>;
