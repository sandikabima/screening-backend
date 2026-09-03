import { z } from "zod";

export const getFollowUpsQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  status: z.enum(["Belum", "Dijadwalkan", "Selesai"]).optional(),
  priorityResult: z.enum(["P1", "P2", "P3", "P4"]).optional(),
  search: z.string().optional(),
});

export const updateFollowUpSchema = z.object({
  status: z.enum(["Belum", "Dijadwalkan", "Selesai"]),
  notes: z.string().min(3, "Catatan follow-up minimal 3 karakter").optional(),
  assignedStaffId: z.string().uuid("Format Staff ID tidak valid").optional(),
});

export type GetFollowUpsQueryInput = z.infer<typeof getFollowUpsQuerySchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
