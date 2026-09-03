import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { UserActor } from "@/services/user.service"; // Import tipe UserActor yang sama persis
import { AuditLogService } from "@/services/auditLog.service";
import {
  CreateRoleInput,
  GetRoleInput,
  RoleResponse,
  UpdateRoleInput,
} from "@/types/role";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { normalizePositiveNumber } from "@/utils/pagination";

export class RoleService {
  static async getRole(query: GetRoleInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const search = query.search?.trim() || "";
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (search) {
      conditions.push(
        sql`(${ilike(roles.name, `%${search}%`)} OR ${ilike(
          roles.displayName,
          `%${search}%`,
        )})`,
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [rolesRaw, totalResult] = await Promise.all([
      db.query.roles.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (rolesTable, { desc }) => [desc(rolesTable.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(${roles.id})` })
        .from(roles)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedRoles = rolesRaw.map((role) => this.mapRole(role));

    return {
      roles: formattedRoles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getRoleById(id: string): Promise<RoleResponse> {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, id),
    });

    if (!role) {
      throw new NotFoundError(`Role with ID ${id} not found`);
    }

    return this.mapRole(role);
  }

  /**
   * CREATE ROLE + AUDIT LOG RECORD
   */
  static async createRole(
    input: CreateRoleInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<RoleResponse> {
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.name, input.name),
    });

    if (existingRole) {
      throw new BadRequestError(`Role ${input.name} already exists`);
    }

    const [createdRole] = await db
      .insert(roles)
      .values({
        name: input.name,
        displayName: input.displayName,
        description: input.description,
      })
      .returning();

    const result = this.mapRole(createdRole);

    // REKAM KE TABEL AUDIT_LOGS
    await AuditLogService.record({
      actorUserId: actor?.userId || result.id,
      actorEmail: actor?.email || "system@internal",
      action: "ROLE_CREATE",
      module: "SYSTEM_SETTING",
      targetEntity: "roles",
      targetId: result.id,
      ipAddress,
      details: {
        roleName: result.name,
        displayName: result.displayName,
        description: result.description,
      },
    });

    return result;
  }

  /**
   * UPDATE ROLE + AUDIT LOG RECORD
   */
  static async updateRole(
    id: string,
    input: UpdateRoleInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<RoleResponse> {
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, id),
    });

    if (!existingRole) {
      throw new NotFoundError(`Role with ID ${id} not found`);
    }

    if (!input.name && !input.displayName && input.description === undefined) {
      throw new BadRequestError("No role data provided for update");
    }

    await db
      .update(roles)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id));

    const updatedRole = await db.query.roles.findFirst({
      where: eq(roles.id, id),
    });

    if (!updatedRole) {
      throw new NotFoundError(`Role with ID ${id} not found after update`);
    }

    const result = this.mapRole(updatedRole);

    // REKAM KE TABEL AUDIT_LOGS
    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "ROLE_UPDATE",
      module: "SYSTEM_SETTING",
      targetEntity: "roles",
      targetId: id,
      ipAddress,
      details: {
        previousState: {
          name: existingRole.name,
          displayName: existingRole.displayName,
          description: existingRole.description,
        },
        updatedFields: input,
      },
    });

    return result;
  }

  /**
   * DELETE ROLE + AUDIT LOG RECORD
   */
  static async deleteRole(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, id),
    });

    if (!existingRole) {
      throw new NotFoundError(`Role with ID ${id} not found`);
    }

    await db.delete(roles).where(eq(roles.id, id));

    // REKAM KE TABEL AUDIT_LOGS
    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "ROLE_DELETE",
      module: "SYSTEM_SETTING",
      targetEntity: "roles",
      targetId: id,
      ipAddress,
      details: {
        deletedRoleName: existingRole.name,
        deletedDisplayName: existingRole.displayName,
      },
    });
  }

  private static mapRole(role: any): RoleResponse {
    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
