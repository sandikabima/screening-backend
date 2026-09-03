import { z } from "zod";

export interface ScreeningScheduleResponse {
  id: string;
  name: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  testerId: string;
  barcodeValue: string;
  statusBarcode: "ACTIVE" | "INACTIVE" | "EXPIRED";
  createdAt: Date;
  updatedAt: Date;
  tester?: {
    id: string;
    name: string;
    email: string;
  };
}

export const createScheduleSchema = z.object({
  name: z
    .string({ message: "Schedule name is required" })
    .min(3, "Schedule name must be at least 3 characters")
    .max(150, "Schedule name must be less than 150 characters")
    .transform((val) => val.trim()),
  tanggal: z
    .string({ message: "Date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  jamMulai: z
    .string({ message: "Start time is required" })
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/,
      "Invalid start time format (HH:mm or HH:mm:ss)",
    ),
  jamSelesai: z
    .string({ message: "End time is required" })
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/,
      "Invalid end time format (HH:mm or HH:mm:ss)",
    ),
  testerId: z
    .string({ message: "Tester ID is required" })
    .uuid("Invalid tester ID format"),
  barcodeValue: z
    .string({ message: "Barcode value is required" })
    .min(3, "Barcode value must be at least 3 characters")
    .transform((val) => val.trim()),
});

export const updateScheduleSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(150)
    .transform((val) => val.trim())
    .optional(),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  jamMulai: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/)
    .optional(),
  jamSelesai: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/)
    .optional(),
  testerId: z.string().uuid().optional(),
  barcodeValue: z
    .string()
    .min(3)
    .transform((val) => val.trim())
    .optional(),
  statusBarcode: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
});

export const getScheduleQuerySchema = z.object({
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  search: z.string().default(""),
  statusBarcode: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
});

export const getScheduleIdSchema = z.object({
  id: z.string().uuid("Invalid schedule ID format"),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type GetScheduleQueryInput = z.infer<typeof getScheduleQuerySchema>;
