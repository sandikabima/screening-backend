import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// 1. TABEL FAKULTAS (faculties)
// ============================================================================
export const faculties = pgTable(
  "faculties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 20 }).notNull().unique(), // Contoh: "FTI", "FK"
    name: varchar("name", { length: 150 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_faculties_is_active").on(table.isActive)],
);

// ============================================================================
// 2. TABEL PROGRAM STUDI (study_programs)
// ============================================================================
export const studyPrograms = pgTable(
  "study_programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    facultyId: uuid("faculty_id")
      .notNull()
      .references(() => faculties.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 20 }).notNull().unique(), // Contoh: "INF", "SI"
    name: varchar("name", { length: 150 }).notNull(),
    degree: varchar("degree", { length: 10 }).notNull(), // S1, D3, S2
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_study_programs_faculty_id").on(table.facultyId), // JOIN ke Fakultas
    index("idx_study_programs_is_active").on(table.isActive),
  ],
);

// ============================================================================
// 3. TABEL ANGKATAN (cohorts)
// ============================================================================
export const cohorts = pgTable(
  "cohorts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    year: integer("year").notNull().unique(), // Contoh: 2024, 2025, 2026
    name: varchar("name", { length: 50 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_cohorts_is_active").on(table.isActive)],
);

// ============================================================================
// 4. TABEL KELAS (classes)
// ============================================================================
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studyProgramId: uuid("study_program_id")
      .notNull()
      .references(() => studyPrograms.id, { onDelete: "restrict" }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 50 }).notNull(), // Contoh: "IF-2024-A"
    code: varchar("code", { length: 50 }).notNull().unique(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_classes_study_program_id").on(table.studyProgramId), // JOIN ke Prodi
    index("idx_classes_cohort_id").on(table.cohortId), // JOIN ke Angkatan
    index("idx_classes_sp_cohort").on(table.studyProgramId, table.cohortId), // Filter Kombinasi Dropdown
    index("idx_classes_is_active").on(table.isActive),
  ],
);

// ============================================================================
// DRIZZLE RELATIONS (Campus Hierarchy)
// ============================================================================
export const facultiesRelations = relations(faculties, ({ many }) => ({
  studyPrograms: many(studyPrograms),
}));

export const studyProgramsRelations = relations(
  studyPrograms,
  ({ one, many }) => ({
    faculty: one(faculties, {
      fields: [studyPrograms.facultyId],
      references: [faculties.id],
    }),
    classes: many(classes),
  }),
);

export const cohortsRelations = relations(cohorts, ({ many }) => ({
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one }) => ({
  studyProgram: one(studyPrograms, {
    fields: [classes.studyProgramId],
    references: [studyPrograms.id],
  }),
  cohort: one(cohorts, {
    fields: [classes.cohortId],
    references: [cohorts.id],
  }),
}));
