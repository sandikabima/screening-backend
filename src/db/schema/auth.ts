import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Import auditLogs untuk relasi ke users
import { auditLogs } from "./audit";

// ==========================================
// ROLES & USERS SCHEMA
// ==========================================

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 100 }).notNull().unique(),
    password: text("password").notNull(),
    name: varchar("name", { length: 100 }),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "restrict" })
      .notNull(),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_users_role_id").on(table.roleId),
    index("idx_users_is_active").on(table.isActive), // Pencarian user aktif
  ],
);

export const userTokens = pgTable(
  "user_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    refreshToken: text("refresh_token").notNull().unique(),
    deviceInfo: text("device_info"),
    isRevoked: boolean("is_revoked").default(false).notNull(),
    expiredAt: timestamp("expired_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_tokens_user_id").on(table.userId),
    index("idx_tokens_expired_revoked").on(table.expiredAt, table.isRevoked), // Validasi token cepat
  ],
);

// ==========================================
// PERMISSIONS SCHEMA
// ==========================================

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  permissionKey: varchar("permission_key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  modul: varchar("modul", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    permissionId: uuid("permission_id")
      .references(() => permissions.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

// ==========================================
// RELATIONS
// ==========================================

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  tokens: many(userTokens),
  auditLogs: many(auditLogs),
}));

export const userTokensRelations = relations(userTokens, ({ one }) => ({
  user: one(users, { fields: [userTokens.userId], references: [users.id] }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);
