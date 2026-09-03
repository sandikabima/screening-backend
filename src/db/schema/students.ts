import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";
import { studyPrograms, cohorts, classes } from "./campus";

// ============================================================================
// TABEL MAHASISWA / PESERTA SCREENING (students)
// ============================================================================
export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Relasi 1-to-1 ke Akun Login Users
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    // Identitas & Demografi Tambahan
    nim: varchar("nim", { length: 30 }).notNull().unique(),
    gender: varchar("gender", { length: 10 }).notNull(), // "L" / "P" atau "MALE" / "FEMALE"
    phoneNumber: varchar("phone_number", { length: 20 }),

    // Relasi Akademis Kampus
    studyProgramId: uuid("study_program_id")
      .notNull()
      .references(() => studyPrograms.id, { onDelete: "restrict" }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "restrict" }),
    classId: uuid("class_id").references(() => classes.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_students_user_id").on(table.userId), // High Performance JOIN Users
    index("idx_students_study_program_id").on(table.studyProgramId), // Filter/Group per Prodi
    index("idx_students_cohort_id").on(table.cohortId), // Filter per Angkatan
    index("idx_students_class_id").on(table.cohortId), // Filter per Rombel/Kelas
    index("idx_students_sp_cohort_class").on(
      table.studyProgramId,
      table.cohortId,
      table.classId,
    ), // Multi-column Index untuk Filter Berlapis di Admin Table
  ],
);

export const studentsRelations = relations(students, ({ one }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  studyProgram: one(studyPrograms, {
    fields: [students.studyProgramId],
    references: [studyPrograms.id],
  }),
  cohort: one(cohorts, {
    fields: [students.cohortId],
    references: [cohorts.id],
  }),
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
}));
