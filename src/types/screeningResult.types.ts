import { z } from "zod";

// ============================================================================
// 1. RAW RESPONSES PAYLOAD TYPE (Dokumen JSONB)
// ============================================================================
export interface RawResponsesPayload {
  srqAnswers: number[]; // Array 20 item (nilainya 0 / 1)
  indicators: {
    f1: number; // Skala 0-3 (Dampak Akademik)
    f2: number; // Skala 0-3 (Dampak Aktivitas Sehari-hari)
    c1: number; // Skala 0-3 (Kemampuan Coping)
    s1: number; // Skala 0-3 (Dukungan Sosial)
    h1: number; // Skala 0-3 (Kebutuhan Bantuan)
  };
  safetyFlag: boolean; // SF / INTI-SF (Override -> P1)
  m1: string[]; // INTI-M1 Multi-select Profile Tags
}

// ============================================================================
// 2. ZOD VALIDATION SCHEMAS
// ============================================================================
export const getScreeningResultQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  scheduleId: z.string().uuid("Format Schedule ID tidak valid").optional(),
  priorityResult: z.enum(["P1", "P2", "P3", "P4"]).optional(),
  search: z.string().optional(),
});

export const submitScreeningResultSchema = z.object({
  sessionId: z.string().uuid("Format Session ID tidak valid"),
  srqAnswers: z
    .array(z.number().min(0).max(1))
    .length(20, "Jawaban SRQ harus berjumlah tepat 20 item"),
  indicators: z.object({
    f1: z.number().min(0).max(3),
    f2: z.number().min(0).max(3),
    c1: z.number().min(0).max(3),
    s1: z.number().min(0).max(3),
    h1: z.number().min(0).max(3),
  }),
  safetyFlag: z.boolean(),
  m1: z.array(z.string()).default([]), // Multi-select Profile Tag (INTI-M1)
});

export type GetScreeningResultQueryInput = z.infer<
  typeof getScreeningResultQuerySchema
>;
export type SubmitScreeningResultInput = z.infer<
  typeof submitScreeningResultSchema
>;

// ============================================================================
// 3. SANITIZED USER & DTO RESPONSE INTERFACES
// ============================================================================
export interface CleanUserResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  isActive: boolean;
}

// Interface Ringkasan List Dashboard (Optimized Payload / Tanpa Raw Responses JSONB)
export interface ScreeningResultResponse {
  id: string;
  sessionId: string;
  studentId: string;
  srqCutOffId?: string | null;
  srqScore: number;
  srqCutOffUsed: number;
  isSrqAboveCutOff: boolean;
  hasHighIndicator: boolean;
  safetyFlag: boolean;
  priorityResult: "P1" | "P2" | "P3" | "P4";
  reasonCode: "R01" | "R02" | "R03" | "R04" | "R05";
  ruleVersion: string;
  calculatedAt: Date;
  session?: {
    id: string;
    status: string;
    schedule?: {
      id: string;
      name: string;
      tanggal: string;
    };
  };
  student?: {
    id: string;
    nim: string;
    gender: string;
    user?: CleanUserResponse;
    studyProgram?: { id: string; name: string; code: string };
    cohort?: { id: string; year: number; name: string };
  };
  followUps?: Array<{
    id: string;
    status: string;
    notes: string | null;
    createdAt: Date;
  }>;
}

// Interface Detail Jawaban Lengkap (Modal On-Demand)
export interface ScreeningResultDetailResponse extends ScreeningResultResponse {
  rawResponses: RawResponsesPayload;
}
