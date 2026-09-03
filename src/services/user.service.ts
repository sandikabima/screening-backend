import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { roles, users } from "@/db/schema";
import {
  Auth,
  AuthRole,
  AuthWithoutResponse,
  GetUsersInput,
  RegisterInput,
  UpdateUserInput,
} from "@/types/auth";
import { NotFoundError } from "@/utils/errors";
import logger from "@/utils/logger";
import { PasswordUtils } from "@/utils/password";
import { AuditLogService } from "@/services/auditLog.service";

export interface UserActor {
  userId: string;
  email: string;
}

export class UserService {
  static async getUsers(query: GetUsersInput) {
    const page = this.normalizePositiveNumber(query.page, 1);
    const limit = this.normalizePositiveNumber(query.limit, 10);
    const search = query.search?.trim() || "";
    const { roleId } = query;
    const offset = (page - 1) * limit;

    let isActive: boolean | undefined;
    if (query.isActive === true) isActive = true;
    if (query.isActive === false) isActive = false;

    const conditions: any[] = [];
    if (isActive !== undefined) conditions.push(eq(users.isActive, isActive));
    if (roleId) conditions.push(eq(users.roleId, roleId));
    if (search) {
      conditions.push(
        sql`(${ilike(users.name, `%${search}%`)} OR ${ilike(users.email, `%${search}%`)})`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [usersRaw, totalResult] = await Promise.all([
      db.query.users.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (usersTable, { desc }) => [desc(usersTable.createdAt)],
        with: {
          role: {
            with: {
              rolePermissions: {
                with: {
                  permission: true,
                },
              },
            },
          },
        },
      }),
      db
        .select({ count: sql<number>`count(${users.id})` })
        .from(users)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedUsers: AuthWithoutResponse[] = usersRaw.map((userRaw) => {
      const user = this.buildUserFromRaw(userRaw);
      return this.sanitizeUser(user);
    });

    return {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getById(id: string): Promise<AuthWithoutResponse> {
    const userRaw = await this.getUserWithRelations(id);

    if (!userRaw) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    return this.sanitizeUser(this.buildUserFromRaw(userRaw));
  }

  /**
   * CREATE USER + AUDIT LOG RECORD
   */
  static async createUsers(
    input: RegisterInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<Auth> {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      throw new Error("Email already existing");
    }

    const defaultRole = await db.query.roles.findFirst({
      where: eq(roles.name, input.role || AuthRole.USER),
    });

    if (!defaultRole) {
      throw new Error("Default role not found");
    }

    const hashedPassword = await PasswordUtils.hash(input.password);
    const [createdUser] = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        password: hashedPassword,
        roleId: defaultRole.id,
        isActive: true,
      })
      .returning();

    // REKAM KE TABEL AUDIT_LOGS DENGAN TRY-CATCH AMAN
    try {
      await AuditLogService.record({
        actorUserId: actor?.userId || createdUser.id,
        actorEmail: actor?.email || createdUser.email,
        action: "USER_CREATE",
        module: "USER_MANAGEMENT",
        targetEntity: "users",
        targetId: createdUser.id,
        ipAddress: ipAddress || null,
        details: {
          registeredName: createdUser.name,
          registeredEmail: createdUser.email,
          role: defaultRole.name,
        },
      });
    } catch (auditErr) {
      logger.error("Gagal merekam audit log createUsers:", auditErr);
    }

    return {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      roleId: defaultRole.id,
      role: defaultRole.name as AuthRole,
      permissions: [],
      avatarUrl: createdUser.avatarUrl,
      isActive: createdUser.isActive,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    };
  }

  /**
   * UPDATE USER + AUDIT LOG RECORD
   */
  static async update(
    id: string,
    data: UpdateUserInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<AuthWithoutResponse> {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    if (Object.keys(data).length === 0) {
      throw new Error("No update data provided");
    }

    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    const updatedRaw = await this.getUserWithRelations(id);

    if (!updatedRaw) {
      throw new NotFoundError(
        `Failed to retrieve updated user data for ID ${id}`,
      );
    }

    const result = this.sanitizeUser(this.buildUserFromRaw(updatedRaw));

    // REKAM KE TABEL AUDIT_LOGS DENGAN TRY-CATCH AMAN
    try {
      await AuditLogService.record({
        actorUserId: actor?.userId || null,
        actorEmail: actor?.email || "system@internal",
        action: "USER_UPDATE",
        module: "USER_MANAGEMENT",
        targetEntity: "users",
        targetId: id,
        ipAddress: ipAddress || null,
        details: {
          updatedFields: Object.keys(data),
          updatedUserEmail: result.email,
        },
      });
    } catch (auditErr) {
      logger.error("Gagal merekam audit log updateUser:", auditErr);
    }

    return result;
  }

  /**
   * CHANGE USER STATUS + AUDIT LOG RECORD
   */
  static async changeStatus(
    id: string,
    isActive: boolean,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<AuthWithoutResponse> {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id));

    const updatedRaw = await this.getUserWithRelations(id);

    if (!updatedRaw) {
      throw new NotFoundError(
        `Failed to retrieve user status data for ID ${id}`,
      );
    }

    const result = this.sanitizeUser(this.buildUserFromRaw(updatedRaw));

    // REKAM KE TABEL AUDIT_LOGS DENGAN TRY-CATCH AMAN
    try {
      await AuditLogService.record({
        actorUserId: actor?.userId || null,
        actorEmail: actor?.email || "system@internal",
        action: "USER_TOGGLE_STATUS",
        module: "USER_MANAGEMENT",
        targetEntity: "users",
        targetId: id,
        ipAddress: ipAddress || null,
        details: {
          targetUserEmail: result.email,
          newStatus: isActive ? "ACTIVE" : "INACTIVE",
        },
      });
    } catch (auditErr) {
      logger.error("Gagal merekam audit log changeStatus:", auditErr);
    }

    return result;
  }

  /**
   * DELETE USER + AUDIT LOG RECORD
   */
  static async delete(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existingUser) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    await db.delete(users).where(eq(users.id, id));
    logger.warn("User permanently deleted from system", { userId: id });

    // REKAM KE TABEL AUDIT_LOGS DENGAN TRY-CATCH AMAN
    try {
      await AuditLogService.record({
        actorUserId: actor?.userId || null,
        actorEmail: actor?.email || "system@internal",
        action: "USER_DELETE",
        module: "USER_MANAGEMENT",
        targetEntity: "users",
        targetId: id,
        ipAddress: ipAddress || null,
        details: {
          deletedUserEmail: existingUser.email,
        },
      });
    } catch (auditErr) {
      logger.error("Gagal merekam audit log deleteUser:", auditErr);
    }
  }

  private static buildUserFromRaw(userRaw: any): Auth {
    const permissions =
      userRaw.role?.rolePermissions.map(
        (rolePermission: { permission: { permissionKey: string } }) =>
          rolePermission.permission.permissionKey,
      ) || [];

    return {
      id: userRaw.id,
      email: userRaw.email,
      name: userRaw.name,
      displayName: userRaw.role?.displayName,
      roleId: userRaw.role?.id,
      role: (userRaw.role?.name || AuthRole.USER) as AuthRole,
      permissions,
      avatarUrl: userRaw.avatarUrl,
      isActive: userRaw.isActive,
      createdAt: userRaw.createdAt,
      updatedAt: userRaw.updatedAt,
    };
  }

  private static async getUserWithRelations(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        role: {
          with: {
            rolePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  private static normalizePositiveNumber(
    value: number | string | undefined,
    fallback: number,
  ) {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private static sanitizeUser(auth: Auth): AuthWithoutResponse {
    const { password, ...userWithoutPassword } = auth;
    return userWithoutPassword;
  }
}
