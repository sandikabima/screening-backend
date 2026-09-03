import { z } from "zod";

export interface OptionResponse {
  id: string;
  questionId: string;
  optionLabel: string;
  score: number;
  orderNumber: number;
}

export interface QuestionResponse {
  id: string;
  code: string;
  category: "SRQ" | "INTI";
  questionText: string;
  orderNumber: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  options?: OptionResponse[];
}

export const getQuestionsQuerySchema = z.object({
  category: z
    .enum(["SRQ", "INTI"], { message: "Kategori harus 'SRQ' atau 'INTI'" })
    .optional(),
  code: z.string().optional(),
  search: z.string().optional().default(""),
});

export const getQuestionIdSchema = z.object({
  id: z.string().uuid("Format ID pertanyaan tidak valid"),
});

export const updateQuestionSchema = z.object({
  questionText: z
    .string({ message: "Teks pertanyaan wajib diisi" })
    .min(5, "Teks pertanyaan minimal 5 karakter")
    .max(1000, "Teks pertanyaan maksimal 1000 karakter")
    .transform((val) => val.trim()),
});

export const toggleQuestionStatusSchema = z.object({
  isActive: z.boolean({ message: "Status isActive harus berupa boolean" }),
});

export type GetQuestionsQueryInput = z.infer<typeof getQuestionsQuerySchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ToggleQuestionStatusInput = z.infer<
  typeof toggleQuestionStatusSchema
>;
