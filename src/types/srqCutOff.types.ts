import { z } from "zod";

export const updateSrqCutOffSchema = z.object({
  cutoffScore: z
    .number({ message: "Cutoff score wajib berupa angka" })
    .min(1, "Cutoff score minimal 1")
    .max(20, "Cutoff score maksimal 20"),
  label: z
    .string({ message: "Label wajib diisi" })
    .min(3, "Label minimal 3 karakter")
    .max(100, "Label maksimal 100 karakter")
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .transform((val) => val?.trim() || ""),
});

export const getSrqCutOffIdSchema = z.object({
  id: z.string().uuid("ID Cut-Off tidak valid"),
});

export type UpdateSrqCutOffInput = z.infer<typeof updateSrqCutOffSchema>;
