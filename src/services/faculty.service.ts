import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { faculties } from "@/db/schema";
import { UserActor } from "@/services/user.service";
import { AuditLogService } from "@/services/auditLog.service";
import {
  CreateFacultyInput,
  GetFacultyQueryInput,
  FacultyResponse,
  FacultyPublicResponse,
  UpdateFacultyInput,
  ToggleFacultyStatusInput,
} from "@/types/faculty.types";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { normalizePositiveNumber } from "@/utils/pagination";

export class FacultyService {
  /**
   * GET PUBLIC FACULTIES (Dropdown Pendaftaran)
   */
  static async getPublicFaculties(): Promise<FacultyPublicResponse[]> {
    const activeFaculties = await db.query.faculties.findMany({
      where: eq(faculties.isActive, true),
      orderBy: (facultyTable, { asc }) => [asc(facultyTable.code)],
    });

    return activeFaculties.map((f) => ({
      id: f.id,
      code: f.code,
      name: f.name,
    }));
  }

  /**
   * GET ALL FACULTIES + PAGINATION & SEARCH (Admin Panel)
   */
  static async getFaculties(query: GetFacultyQueryInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const search = query.search?.trim() || "";
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        sql`(${ilike(faculties.code, `%${search}%`)} OR ${ilike(
          faculties.name,
          `%${search}%`,
        )})`,
      );
    }

    if (query.isActive !== undefined) {
      conditions.push(eq(faculties.isActive, query.isActive));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [facultiesRaw, totalResult] = await Promise.all([
      db.query.faculties.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (facultyTable, { desc }) => [desc(facultyTable.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(${faculties.id})` })
        .from(faculties)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedFaculties = facultiesRaw.map((faculty) =>
      this.mapFaculty(faculty),
    );

    return {
      faculties: formattedFaculties,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * GET FACULTY BY ID
   */
  static async getFacultyById(id: string): Promise<FacultyResponse> {
    const faculty = await db.query.faculties.findFirst({
      where: eq(faculties.id, id),
    });

    if (!faculty) {
      throw new NotFoundError(`Faculty with ID ${id} not found`);
    }

    return this.mapFaculty(faculty);
  }

  /**
   * CREATE FACULTY + AUDIT LOG RECORD
   */
  static async createFaculty(
    input: CreateFacultyInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<FacultyResponse> {
    const existingFaculty = await db.query.faculties.findFirst({
      where: eq(faculties.code, input.code),
    });

    if (existingFaculty) {
      throw new BadRequestError(
        `Faculty with code ${input.code} already exists`,
      );
    }

    const [createdFaculty] = await db
      .insert(faculties)
      .values({
        code: input.code,
        name: input.name,
      })
      .returning();

    const result = this.mapFaculty(createdFaculty);

    // REKAM KE TABEL AUDIT_LOGS
    await AuditLogService.record({
      actorUserId: actor?.userId || result.id,
      actorEmail: actor?.email || "system@internal",
      action: "FACULTY_CREATE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "faculties",
      targetId: result.id,
      ipAddress,
      details: {
        code: result.code,
        name: result.name,
      },
    });

    return result;
  }

  /**
   * UPDATE FACULTY + AUDIT LOG RECORD
   */
  static async updateFaculty(
    id: string,
    input: UpdateFacultyInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<FacultyResponse> {
    const existingFaculty = await db.query.faculties.findFirst({
      where: eq(faculties.id, id),
    });

    if (!existingFaculty) {
      throw new NotFoundError(`Faculty with ID ${id} not found`);
    }

    if (!input.code && !input.name) {
      throw new BadRequestError("No faculty data provided for update");
    }

    if (input.code && input.code !== existingFaculty.code) {
      const codeDuplicate = await db.query.faculties.findFirst({
        where: eq(faculties.code, input.code),
      });

      if (codeDuplicate) {
        throw new BadRequestError(
          `Faculty with code ${input.code} already exists`,
        );
      }
    }

    await db
      .update(faculties)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(faculties.id, id));

    const updatedFaculty = await db.query.faculties.findFirst({
      where: eq(faculties.id, id),
    });

    if (!updatedFaculty) {
      throw new NotFoundError(`Faculty with ID ${id} not found after update`);
    }

    const result = this.mapFaculty(updatedFaculty);

    // REKAM KE TABEL AUDIT_LOGS
    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "FACULTY_UPDATE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "faculties",
      targetId: id,
      ipAddress,
      details: {
        previousState: {
          code: existingFaculty.code,
          name: existingFaculty.name,
        },
        updatedFields: input,
      },
    });

    return result;
  }

  /**
   * DELETE FACULTY + AUDIT LOG RECORD
   */
  static async deleteFaculty(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    const existingFaculty = await db.query.faculties.findFirst({
      where: eq(faculties.id, id),
    });

    if (!existingFaculty) {
      throw new NotFoundError(`Faculty with ID ${id} not found`);
    }

    await db.delete(faculties).where(eq(faculties.id, id));

    // REKAM KE TABEL AUDIT_LOGS
    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "FACULTY_DELETE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "faculties",
      targetId: id,
      ipAddress,
      details: {
        deletedFacultyCode: existingFaculty.code,
        deletedFacultyName: existingFaculty.name,
      },
    });
  }

  /**
   * TOGGLE STATUS IS_ACTIVE + AUDIT LOG RECORD
   */
  static async toggleStatus(
    id: string,
    input: ToggleFacultyStatusInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<FacultyResponse> {
    const existingFaculty = await db.query.faculties.findFirst({
      where: eq(faculties.id, id),
    });

    if (!existingFaculty) {
      throw new NotFoundError(`Faculty with ID ${id} not found`);
    }

    await db
      .update(faculties)
      .set({
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(faculties.id, id));

    const updatedFaculty = await db.query.faculties.findFirst({
      where: eq(faculties.id, id),
    });

    if (!updatedFaculty) {
      throw new NotFoundError(
        `Faculty with ID ${id} not found after status update`,
      );
    }

    const result = this.mapFaculty(updatedFaculty);

    // REKAM KE TABEL AUDIT_LOGS
    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "FACULTY_TOGGLE_STATUS",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "faculties",
      targetId: id,
      ipAddress,
      details: {
        previousState: { isActive: existingFaculty.isActive },
        newState: { isActive: input.isActive },
      },
    });

    return result;
  }

  private static mapFaculty(faculty: any): FacultyResponse {
    return {
      id: faculty.id,
      code: faculty.code,
      name: faculty.name,
      isActive: faculty.isActive,
      createdAt: faculty.createdAt,
      updatedAt: faculty.updatedAt,
    };
  }
}
