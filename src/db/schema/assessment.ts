import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// 1. TABEL BANK SOAL (SRQ-20 & PERTANYAAN INTI)
// ============================================================================
export const triageQuestions = pgTable(
  "triage_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(), // 'SRQ-01'..'SRQ-20', 'INTI-F1'..'INTI-M1'
    category: varchar("category", { length: 20 }).notNull(), // 'SRQ' | 'INTI'
    questionText: text("question_text").notNull(),
    orderNumber: integer("order_number").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true), // Fitur toggle (pengganti delete)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_triage_questions_category").on(table.category),
    index("idx_triage_questions_is_active").on(table.isActive),
  ],
);

// ============================================================================
// 2. TABEL OPSI JAWABAN & SKOR PER SOAL
// ============================================================================
export const triageOptions = pgTable(
  "triage_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => triageQuestions.id, { onDelete: "cascade" }),
    optionLabel: varchar("option_label", { length: 255 }).notNull(), // 'Ya' / 'Tidak' / Skala 0-3 / Multi-select M1
    score: integer("score").notNull().default(0), // SRQ: 0/1 | INTI: 0/1/2/3 | M1: 0
    orderNumber: integer("order_number").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_triage_options_question_id").on(table.questionId)],
);

// ============================================================================
// DRIZZLE RELATIONS
// ============================================================================
export const triageQuestionsRelations = relations(
  triageQuestions,
  ({ many }) => ({
    options: many(triageOptions),
  }),
);

export const triageOptionsRelations = relations(triageOptions, ({ one }) => ({
  question: one(triageQuestions, {
    fields: [triageOptions.questionId],
    references: [triageQuestions.id],
  }),
}));
