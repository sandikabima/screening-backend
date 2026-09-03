import { z } from "zod";

export interface ScreeningSessionResponse {
  id: string;
  scheduleId: string;
  studentId: string;
  status: "In_Progress" | "Completed";
  createdAt: Date;
  updatedAt: Date;
  schedule?: {
    id: string;
    name: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    statusBarcode: string;
  };
  student?: {
    id: string;
    nim: string;
    userId: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export const verifyBarcodeSchema = z.object({
  barcodeValue: z
    .string({ message: "Barcode value is required" })
    .min(1, "Barcode value cannot be empty")
    .transform((val) => val.trim()),
});

export const getSessionQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  scheduleId: z.string().uuid("Invalid schedule ID format").optional(),
  studentId: z.string().uuid("Invalid student ID format").optional(),
  status: z.enum(["In_Progress", "Completed"]).optional(),
});

export const getSessionIdSchema = z.object({
  id: z.string().uuid("Invalid session ID format"),
});

export type VerifyBarcodeInput = z.infer<typeof verifyBarcodeSchema>;
export type GetSessionQueryInput = z.infer<typeof getSessionQuerySchema>;
