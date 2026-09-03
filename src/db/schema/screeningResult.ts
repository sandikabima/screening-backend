import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./auth";
import { students } from "./students";
import { srqCutOffs } from "./srqCutOff";
import { screeningSessions } from "./screeningSession";

// ============================================================================
// 1. TABEL HASIL EVALUASI TRIAGE ENGINE (screening_results)
// ============================================================================
export const screeningResults = pgTable(
  "screening_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    sessionId: uuid("session_id")
      .notNull()
      .unique()
      .references(() => screeningSessions.id, { onDelete: "cascade" }),

    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),

    srqCutOffId: uuid("srq_cut_off_id").references(() => srqCutOffs.id, {
      onDelete: "set null",
    }),

    // ALL RAW ANSWERS (JSONB)
    rawResponses: jsonb("raw_responses")
      .$type<{
        srqAnswers: number[]; // Array 20 item (0 / 1)
        indicators: {
          f1: number; // Skala 0-3
          f2: number;
          c1: number;
          s1: number;
          h1: number;
        };
        safetyFlag: boolean;
      }>()
      .notNull(),

    // DECISION ENGINE METRICS
    srqScore: integer("srq_score").notNull(),
    srqCutOffUsed: integer("srq_cut_off_used").default(6).notNull(),
    isSrqAboveCutOff: boolean("is_srq_above_cut_off").notNull(),
    hasHighIndicator: boolean("has_high_indicator").notNull(),
    safetyFlag: boolean("safety_flag").notNull(),

    priorityResult: varchar("priority_result", { length: 10 }).notNull(), // 'P1' | 'P2' | 'P3' | 'P4'
    reasonCode: varchar("reason_code", { length: 10 }).notNull(), // 'R01' s/d 'R05'
    ruleVersion: varchar("rule_version", { length: 20 })
      .default("TRIAGE-V1.0")
      .notNull(),

    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_results_session_id").on(table.sessionId),
    index("idx_results_student_id").on(table.studentId),
    index("idx_results_priority_result").on(table.priorityResult),
    index("idx_results_calculated_at").on(table.calculatedAt),
  ],
);

// ============================================================================
// 2. TABEL TINDAK LANJUT PSIKOLOG (follow_ups)
// ============================================================================
export const followUps = pgTable(
  "follow_ups",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    screeningResultId: uuid("screening_result_id")
      .notNull()
      .references(() => screeningResults.id, { onDelete: "cascade" }),

    status: varchar("status", { length: 20 }).default("Belum").notNull(), // 'Belum' | 'Dijadwalkan' | 'Selesai'
    notes: text("notes"),

    handledByUserId: uuid("handled_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_follow_ups_screening_result_id").on(table.screeningResultId),
    index("idx_follow_ups_handled_by_user_id").on(table.handledByUserId),
    index("idx_follow_ups_status").on(table.status),
  ],
);

// ============================================================================
// DRIZZLE RELATIONS (Schema 2)
// ============================================================================
export const screeningResultsRelations = relations(
  screeningResults,
  ({ one, many }) => ({
    session: one(screeningSessions, {
      fields: [screeningResults.sessionId],
      references: [screeningSessions.id],
    }),
    student: one(students, {
      fields: [screeningResults.studentId],
      references: [students.id],
    }),
    cutOff: one(srqCutOffs, {
      fields: [screeningResults.srqCutOffId],
      references: [srqCutOffs.id],
    }),
    followUps: many(followUps),
  }),
);

export const followUpsRelations = relations(followUps, ({ one }) => ({
  screeningResult: one(screeningResults, {
    fields: [followUps.screeningResultId],
    references: [screeningResults.id],
  }),
  handledBy: one(users, {
    fields: [followUps.handledByUserId],
    references: [users.id],
  }),
}));
