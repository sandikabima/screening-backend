import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  time,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./auth";
import { students } from "./students";

// ============================================================================
// 1. TABEL JADWAL / BATCH SCREENING (screening_schedules)
// ============================================================================
export const screeningSchedules = pgTable(
  "screening_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    tanggal: date("tanggal").notNull(),
    jamMulai: time("jam_mulai").notNull(),
    jamSelesai: time("jam_selesai").notNull(),

    // Penanggung Jawab Batch (Tester / Psikolog)
    testerId: uuid("tester_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    // Token Akses Barcode
    barcodeValue: varchar("barcode_value", { length: 100 }).notNull().unique(),
    statusBarcode: varchar("status_barcode", { length: 20 })
      .default("ACTIVE")
      .notNull(), // 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_schedules_tester_id").on(table.testerId),
    index("idx_schedules_barcode_value").on(table.barcodeValue),
    index("idx_schedules_status_barcode").on(table.statusBarcode),
  ],
);

// ============================================================================
// 2. TABEL SESI SCREENING MAHASISWA (screening_sessions)
// ============================================================================
export const screeningSessions = pgTable(
  "screening_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => screeningSchedules.id, { onDelete: "cascade" }),

    // UNIQUE CONSTRAINT: Mahasiswa HANYA BISA 1 kali screening
    studentId: uuid("student_id")
      .notNull()
      .unique()
      .references(() => students.id, { onDelete: "cascade" }),

    status: varchar("status", { length: 20 }).default("In_Progress").notNull(), // 'In_Progress' | 'Completed'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_sessions_schedule_id").on(table.scheduleId),
    index("idx_sessions_student_id").on(table.studentId),
    index("idx_sessions_status").on(table.status),
  ],
);

// ============================================================================
// DRIZZLE RELATIONS (Schema 1)
// ============================================================================
export const screeningSchedulesRelations = relations(
  screeningSchedules,
  ({ one, many }) => ({
    tester: one(users, {
      fields: [screeningSchedules.testerId],
      references: [users.id],
    }),
    sessions: many(screeningSessions),
  }),
);

export const screeningSessionsRelations = relations(
  screeningSessions,
  ({ one }) => ({
    schedule: one(screeningSchedules, {
      fields: [screeningSessions.scheduleId],
      references: [screeningSchedules.id],
    }),
    student: one(students, {
      fields: [screeningSessions.studentId],
      references: [students.id],
    }),
  }),
);
