import { z } from "zod";

// ==========================================
// INTERFACES & RESPONSES
// ==========================================

export interface StudentResponse {
  id: string;
  userId: string;
  nim: string;
  gender: "L" | "P";
  phoneNumber: string;
  studyProgramId: string;
  cohortId: string;
  classId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    isActive: boolean;
  };
  studyProgram?: {
    id: string;
    facultyId: string;
    code: string;
    name: string;
    degree: string;
    faculty?: {
      id: string;
      code: string;
      name: string;
    };
  };
  cohort?: {
    id: string;
    year: number;
    name: string;
  };
  class?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

// ==========================================
// ZOD SCHEMAS
// ==========================================

// FULL MULTI-FILTER QUERY SCHEMA
export const getStudentQuerySchema = z.object({
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
  studyProgramId: z.string().uuid("Invalid study program ID format").optional(),
  cohortId: z.string().uuid("Invalid cohort ID format").optional(),
  classId: z.string().uuid("Invalid class ID format").optional(),
  gender: z
    .enum(["L", "P"], { message: "Gender must be 'L' or 'P'" })
    .optional(),
});

export const getStudentIdSchema = z.object({
  id: z.string().uuid("Invalid student ID format"),
});

// FORM REGISTRASI MANDIRI / PUBLIK
export const registerStudentSchema = z.object({
  nim: z
    .string({ message: "NIM is required" })
    .min(3, "NIM must be at least 3 characters")
    .max(30, "NIM must be less than 30 characters")
    .transform((val) => val.trim()),
  name: z
    .string({ message: "Name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters")
    .transform((val) => val.trim()),
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be less than 100 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  gender: z.enum(["L", "P"], {
    message: "Gender must be 'L' or 'P'",
  }),
  phoneNumber: z
    .string({ message: "Phone number is required" })
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .transform((val) => val.trim()),
  studyProgramId: z
    .string({ message: "Study program is required" })
    .uuid("Invalid study program ID format"),
  cohortId: z
    .string({ message: "Cohort is required" })
    .uuid("Invalid cohort ID format"),
  classId: z.string().uuid("Invalid class ID format").optional(),
});

// UPDATE PROFILE/DATA MAHASISWA (ADMIN)
export const updateStudentSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters")
    .transform((val) => val.trim())
    .optional(),
  gender: z.enum(["L", "P"]).optional(),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .transform((val) => val.trim())
    .optional(),
  studyProgramId: z.string().uuid("Invalid study program ID format").optional(),
  cohortId: z.string().uuid("Invalid cohort ID format").optional(),
  classId: z.string().uuid("Invalid class ID format").nullable().optional(),
});

// ==========================================
// INFERRED TYPES
// ==========================================

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type GetStudentQueryInput = z.infer<typeof getStudentQuerySchema>;
