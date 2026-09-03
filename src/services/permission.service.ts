import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { permissions, rolePermissions, roles } from "@/db/schema";
import { UserActor } from "@/services/user.service"; // Pakai UserActor yang sama
import { AuditLogService } from "@/services/auditLog.service";
import {
  AssignPermissionsInput,
  CreatePermissionInput,
  PermissionCatalogItem,
  PermissionListResponse,
  PermissionSummary,
  RoleWithPermissionsResponse,
  UpdatePermissionInput,
} from "@/types/permission";

import { BadRequestError, NotFoundError } from "@/utils/errors";
import logger from "@/utils/logger";
import { buildPaginationMeta } from "@/utils/pagination";

export class PermissionService {
  static async listPermissions(
    input: { page?: number; limit?: number; search?: string } = {},
  ): Promise<PermissionListResponse> {
    const page = Number(input.page ?? 1);
    const limit = Number(input.limit ?? 100);
    const search = input.search?.trim() ?? "";
    const offset = (page - 1) * limit;

    const conditions = [] as any[];
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(permissions.permissionKey, searchPattern),
          ilike(permissions.name, searchPattern),
        ),
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db.query.permissions.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (table, { asc }) => [
          asc(table.modul),
          asc(table.permissionKey),
        ],
      }),
      db
        .select({ count: sql<number>`count(${permissions.id})` })
        .from(permissions)
        .where(whereClause),
    ]);

    const totalItems = Number(totalResult[0]?.count) || 0;

    return {
      permissions: items.map((item) => this.mapPermissionCatalog(item)),
      pagination: buildPaginationMeta(page, limit, totalItems),
    };
  }

  static async getPermissionById(id: string): Promise<PermissionCatalogItem> {
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, id),
    });

    if (!permission) {
      throw new NotFoundError(`Permission dengan ID ${id} tidak ditemukan`);
    }

    return this.mapPermissionCatalog(permission);
  }

  /**
   * CREATE PERMISSION + AUDIT LOG RECORD
   */
  static async createPermission(
    input: CreatePermissionInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<PermissionCatalogItem> {
    const createdPermission = await db.transaction(async (tx) => {
      const existingPermission = await tx.query.permissions.findFirst({
        where: eq(permissions.permissionKey, input.permissionKey),
      });

      if (existingPermission) {
        throw new BadRequestError(
          `Permission key '${input.permissionKey}' sudah terdaftar dalam sistem`,
        );
      }

      const [newPermission] = await tx
        .insert(permissions)
        .values({
          permissionKey: input.permissionKey,
          name: input.name,
          modul: input.module,
        })
        .returning();

      logger.info("Permission baru berhasil dibuat", {
        permissionKey: newPermission.permissionKey,
        actorEmail: actor?.email,
      });

      return newPermission;
    });

    const result = this.mapPermissionCatalog(createdPermission);

    // REKAM KE TABEL AUDIT_LOGS DENGAN TRY-CATCH AMAN
    try {
      await AuditLogService.record({
        actorUserId: actor?.userId || result.id,
        actorEmail: actor?.email || "system@internal",
        action: "PERMISSION_CREATE",
        module: "SYSTEM_SETTING",
        targetEntity: "permissions",
        targetId: result.id,
        ipAddress: ipAddress || null,
        details: {
          permissionKey: result.permissionKey,
          name: result.name,
          module: result.module,
        },
      });
    } catch (auditErr) {
      logger.error("Gagal merekam audit log createPermission:", auditErr);
    }

    return result;
  }

  /**
   * UPDATE PERMISSION + AUDIT LOG RECORD
   */
  static async updatePermission(
    id: string,
    input: UpdatePermissionInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<PermissionCatalogItem> {
    let existingPermissionState: any = null;

    const updatedPermission = await db.transaction(async (tx) => {
      const existingPermission = await tx.query.permissions.findFirst({
        where: eq(permissions.id, id),
      });

      if (!existingPermission) {
        throw new NotFoundError(`Permission dengan ID ${id} tidak ditemukan`);
      }

      existingPermissionState = existingPermission;

      if (!input.permissionKey && !input.name && !input.module) {
        throw new BadRequestError(
          "Tidak ada data yang diberikan untuk pembaruan",
        );
      }

      const updatePayload: Record<string, unknown> = {};
      if (input.permissionKey)
        updatePayload.permissionKey = input.permissionKey;
      if (input.name) updatePayload.name = input.name;
      if (input.module) updatePayload.modul = input.module;

      await tx
        .update(permissions)
        .set(updatePayload)
        .where(eq(permissions.id, id));

      const updated = await tx.query.permissions.findFirst({
        where: eq(permissions.id, id),
      });

      if (!updated) {
        throw new NotFoundError(
          `Gagal mengambil data permission ID ${id} setelah pembaruan`,
        );
      }

      logger.info("Permission berhasil diperbarui", {
        permissionId: id,
        actorEmail: actor?.email,
      });

      return updated;
    });

    const result = this.mapPermissionCatalog(updatedPermission);

    // REKAM KE TABEL AUDIT_LOGS DENGAN TRY-CATCH AMAN
    try {
      await AuditLogService.record({
        actorUserId: actor?.userId || null,
        actorEmail: actor?.email || "system@internal",
        action: "PERMISSION_UPDATE",
        module: "SYSTEM_SETTING",
        targetEntity: "permissions",
        targetId: id,
        ipAddress: ipAddress || null,
        details: {
          previousState: {
            permissionKey: existingPermissionState?.permissionKey,
            name: existingPermissionState?.name,
            module: existingPermissionState?.modul,
          },
          updatedFields: input,
        },
      });
    } catch (auditErr) {
      logger.error("Gagal merekam audit log updatePermission:", auditErr);
    }

    return result;
  }

  /**
   * DELETE PERMISSION + AUDIT LOG RECORD
   */
  static async deletePermission(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    let existingPermissionState: any = null;

    await db.transaction(async (tx) => {
      const existingPermission = await tx.query.permissions.findFirst({
        where: eq(permissions.id, id),
      });

      if (!existingPermission) {
        throw new NotFoundError(`Permission dengan ID ${id} tidak ditemukan`);
      }

      existingPermissionState = existingPermission;

      const linkedRoles = await tx.query.rolePermissions.findMany({
        where: eq(rolePermissions.permissionId, id),
      });

      if (linkedRoles.length > 0) {
        throw new BadRequestError(
          "Permission ini masih terikat dengan satu atau lebih role dan tidak dapat dihapus",
        );
      }

      await tx.delete(permissions).where(eq(permissions.id, id));

      logger.info("Permission berhasil dihapus", {
        permissionId: id,
        permissionKey: existingPermission.permissionKey,
        actorEmail: actor?.email,
      });
    });

    // REKAM KE TABEL AUDIT_LOGS DENGAN TRY-CATCH AMAN
    try {
      await AuditLogService.record({
        actorUserId: actor?.userId || null,
        actorEmail: actor?.email || "system@internal",
        action: "PERMISSION_DELETE",
        module: "SYSTEM_SETTING",
        targetEntity: "permissions",
        targetId: id,
        ipAddress: ipAddress || null,
        details: {
          deletedPermissionKey: existingPermissionState?.permissionKey,
          deletedName: existingPermissionState?.name,
        },
      });
    } catch (auditErr) {
      logger.error("Gagal merekam audit log deletePermission:", auditErr);
    }
  }

  /**
   * ASSIGN PERMISSIONS TO ROLE + AUDIT LOG RECORD
   */
  static async assign(
    data: AssignPermissionsInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<RoleWithPermissionsResponse> {
    const { roleId, permissionIds } = data;
    let targetRoleName = "";

    const result = await db.transaction(async (tx) => {
      const targetRole = await tx.query.roles.findFirst({
        where: eq(roles.id, roleId),
      });

      if (!targetRole) {
        throw new NotFoundError(`Role dengan ID ${roleId} tidak ditemukan`);
      }

      targetRoleName = targetRole.name;

      if (targetRole.name === "ADMIN" && permissionIds.length === 0) {
        throw new BadRequestError(
          "Role inti ADMIN tidak boleh dikosongkan dari hak akses",
        );
      }

      let validPermissions: any[] = [];
      if (permissionIds.length > 0) {
        validPermissions = await tx.query.permissions.findMany({
          where: inArray(permissions.id, permissionIds),
        });

        if (validPermissions.length !== permissionIds.length) {
          throw new BadRequestError(
            "Satu atau lebih ID permission tidak valid atau tidak ditemukan dalam sistem",
          );
        }
      }

      await tx
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      if (permissionIds.length > 0) {
        await tx.insert(rolePermissions).values(
          permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        );
      }

      logger.info("Penetapan hak akses role berhasil diperbarui", {
        roleId,
        roleName: targetRole.name,
        actorEmail: actor?.email,
        totalPermissionsAssigned: permissionIds.length,
      });

      return {
        roleId: targetRole.id,
        roleName: targetRole.name,
        permissions: validPermissions.map((permission) =>
          this.mapPermissionSummary(permission),
        ),
      };
    });

    // REKAM KE TABEL AUDIT_LOGS DENGAN TRY-CATCH AMAN
    try {
      await AuditLogService.record({
        actorUserId: actor?.userId || null,
        actorEmail: actor?.email || "system@internal",
        action: "PERMISSION_ASSIGN",
        module: "SYSTEM_SETTING",
        targetEntity: "role_permissions",
        targetId: roleId,
        ipAddress: ipAddress || null,
        details: {
          targetRoleId: roleId,
          targetRoleName,
          assignedPermissionIds: permissionIds,
          totalAssigned: permissionIds.length,
        },
      });
    } catch (auditErr) {
      logger.error("Gagal merekam audit log assignPermissions:", auditErr);
    }

    return result;
  }

  static async getRolePermissions(
    roleId: string,
  ): Promise<PermissionSummary[]> {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError(`Role dengan ID ${roleId} tidak ditemukan`);
    }

    return role.rolePermissions.map((item) =>
      this.mapPermissionSummary(item.permission),
    );
  }

  private static mapPermissionCatalog(permission: any): PermissionCatalogItem {
    return {
      id: permission.id,
      permissionKey: permission.permissionKey,
      name: permission.name,
      module: permission.modul,
      createdAt: permission.createdAt,
    };
  }

  private static mapPermissionSummary(permission: any): PermissionSummary {
    return {
      id: permission.id,
      permissionKey: permission.permissionKey,
      name: permission.name,
      module: permission.modul,
    };
  }
}
