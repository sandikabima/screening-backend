import { z } from "zod";

// ==========================================
// INTERFACES & RESPONSES
// ==========================================

export interface CohortResponse {
  id: string;
  year: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CohortPublicResponse {
  id: string;
  year: number;
  name: string;
}

// ==========================================
// ZOD SCHEMAS
// ==========================================

export const getCohortQuerySchema = z.object({
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

export const getCohortIdSchema = z.object({
  id: z.string().uuid("Invalid cohort ID format"),
});

export const createCohortSchema = z.object({
  year: z
    .number({ message: "Year must be a number" })
    .int("Year must be an integer")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
  name: z
    .string({ message: "Cohort name is required" })
    .min(3, "Cohort name must be at least 3 characters")
    .max(100, "Cohort name must be less than 100 characters")
    .transform((val) => val.trim()),
});

export const updateCohortSchema = z.object({
  year: z
    .number({ message: "Year must be a number" })
    .int("Year must be an integer")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier")
    .optional(),
  name: z
    .string()
    .min(3, "Cohort name must be at least 3 characters")
    .max(100, "Cohort name must be less than 100 characters")
    .transform((val) => val.trim())
    .optional(),
});

export const toggleCohortStatusSchema = z.object({
  isActive: z.boolean({ message: "isActive status is required" }),
});

// ==========================================
// INFERRED TYPES
// ==========================================

export type CreateCohortInput = z.infer<typeof createCohortSchema>;
export type UpdateCohortInput = z.infer<typeof updateCohortSchema>;
export type ToggleCohortStatusInput = z.infer<typeof toggleCohortStatusSchema>;
export type GetCohortQueryInput = z.infer<typeof getCohortQuerySchema>;
