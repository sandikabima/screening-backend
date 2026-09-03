import dotenv from "dotenv";
dotenv.config();

import { db } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { permissions, rolePermissions, roles, users } from "@/db/schema";
import { PasswordUtils } from "@/utils/password";
import logger from "@/utils/logger";

// 1. ROLES DEFINITION
const seedRoles = [
  {
    name: "SUPER_ADMIN",
    displayName: "Super Administrator",
    description:
      "Akses mutlak penuh untuk seluruh modul sistem dan konfigurasi RBAC",
  },
  {
    name: "USER",
    displayName: "Pengguna Standar",
    description: "Akses operasional standar aplikasi",
  },
];

// 2. PERMISSIONS DEFINITION (Hanya 1 Permission: SYSTEM_SETTING)
const seedPermissions = [
  {
    permissionKey: "SYSTEM_SETTING",
    name: "Pengaturan Sistem Global",
    modul: "SYSTEM", // Field wajib dari schema kamu
  },
];

const adminEmail = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@test.com";
const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? "admin123";

async function seed() {
  logger.info(
    "⏳ Memulai proses seeding RBAC Minimalis (System Setting Only)...",
  );

  await db.transaction(async (tx) => {
    // ---------------------------------------------------------
    // 1. SEED ROLES
    // ---------------------------------------------------------
    const existingRoles = await tx.query.roles.findMany({
      where: inArray(
        roles.name,
        seedRoles.map((role) => role.name),
      ),
    });

    const existingRoleNames = new Set(existingRoles.map((role) => role.name));
    const rolesToCreate = seedRoles.filter(
      (role) => !existingRoleNames.has(role.name),
    );

    if (rolesToCreate.length > 0) {
      await tx.insert(roles).values(rolesToCreate);
      logger.info("✅ Default roles created", {
        created: rolesToCreate.length,
      });
    } else {
      logger.info("ℹ️ Default roles already exist");
    }

    // ---------------------------------------------------------
    // 2. SEED PERMISSIONS
    // ---------------------------------------------------------
    const existingPermissions = await tx.query.permissions.findMany({
      where: inArray(
        permissions.permissionKey,
        seedPermissions.map((p) => p.permissionKey),
      ),
    });

    const existingPermissionKeys = new Set(
      existingPermissions.map((p) => p.permissionKey),
    );
    const permissionsToCreate = seedPermissions.filter(
      (p) => !existingPermissionKeys.has(p.permissionKey),
    );

    if (permissionsToCreate.length > 0) {
      await tx.insert(permissions).values(permissionsToCreate);
      logger.info("✅ Default permissions created", {
        created: permissionsToCreate.length,
      });
    } else {
      logger.info("ℹ️ Default permissions already exist");
    }

    // ---------------------------------------------------------
    // 3. AMBIL REFERENCE ROLE & PERMISSION
    // ---------------------------------------------------------
    const superAdminRole = await tx.query.roles.findFirst({
      where: eq(roles.name, "SUPER_ADMIN"),
    });

    if (!superAdminRole) {
      throw new Error("SUPER_ADMIN role must be present after seeding");
    }

    const permissionRecords = await tx.query.permissions.findMany({
      where: inArray(
        permissions.permissionKey,
        seedPermissions.map((p) => p.permissionKey),
      ),
    });

    // ---------------------------------------------------------
    // 4. ASSIGN SYSTEM_SETTING PERMISSION TO SUPER_ADMIN
    // ---------------------------------------------------------
    const roleLinks = [
      {
        roleId: superAdminRole.id,
        permissionIds: permissionRecords.map((p) => p.id),
      },
    ];

    for (const link of roleLinks) {
      const existingAssignments = await tx.query.rolePermissions.findMany({
        where: and(
          eq(rolePermissions.roleId, link.roleId),
          inArray(rolePermissions.permissionId, link.permissionIds),
        ),
      });

      const existingAssignmentSet = new Set(
        existingAssignments.map((a) => `${a.roleId}:${a.permissionId}`),
      );

      const assignmentsToCreate = link.permissionIds.filter(
        (permissionId) =>
          !existingAssignmentSet.has(`${link.roleId}:${permissionId}`),
      );

      if (assignmentsToCreate.length > 0) {
        await tx.insert(rolePermissions).values(
          assignmentsToCreate.map((permissionId) => ({
            roleId: link.roleId,
            permissionId,
          })),
        );
        logger.info("✅ Assigned SYSTEM_SETTING to SUPER_ADMIN");
      }
    }

    // ---------------------------------------------------------
    // 5. SEED DEFAULT ADMIN USER
    // ---------------------------------------------------------
    let adminUser = await tx.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (!adminUser) {
      const hashedPassword = await PasswordUtils.hash(adminPassword);
      const [newAdmin] = await tx
        .insert(users)
        .values({
          email: adminEmail,
          name: "System Administrator",
          password: hashedPassword,
          roleId: superAdminRole.id,
          isActive: true,
        })
        .returning();
      adminUser = newAdmin;
      logger.info("✅ Default admin user created", { email: adminEmail });
    } else {
      logger.info("ℹ️ Default admin user already exists", {
        email: adminEmail,
      });
    }
  });

  logger.info(
    `🎉 RBAC Seeding selesai! Admin Credentials: ${adminEmail} / ${adminPassword}`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Seeder gagal", {
      error: error instanceof Error ? error.message : error,
    });
    process.exit(1);
  });
