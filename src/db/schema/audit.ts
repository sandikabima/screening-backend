import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./auth";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorEmail: varchar("actor_email", { length: 100 }),

    action: varchar("action", { length: 50 }).notNull(),
    module: varchar("module", { length: 50 }).notNull(),

    targetEntity: varchar("target_entity", { length: 50 }),
    targetId: uuid("target_id"),

    ipAddress: varchar("ip_address", { length: 45 }),
    details: jsonb("details"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_actor_user_id").on(table.actorUserId),
    index("idx_audit_module_action").on(table.module, table.action),
    index("idx_audit_target").on(table.targetEntity, table.targetId),
    index("idx_audit_created_at").on(table.createdAt),
  ],
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
}));
