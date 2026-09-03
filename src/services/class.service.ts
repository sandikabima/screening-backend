import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { classes, cohorts, studyPrograms } from "@/db/schema";
import { UserActor } from "@/services/user.service";
import { AuditLogService } from "@/services/auditLog.service";
import {
  ClassPublicResponse,
  ClassResponse,
  CreateClassInput,
  GetClassQueryInput,
  ToggleClassStatusInput,
  UpdateClassInput,
} from "@/types/class.types";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { normalizePositiveNumber } from "@/utils/pagination";

export class ClassService {
  /**
   * GET PUBLIC CLASSES (Dropdown Form Registrasi/Screening Mahasiswa)
   */
  static async getPublicClasses(): Promise<ClassPublicResponse[]> {
    const list = await db
      .select({
        id: classes.id,
        studyProgramId: classes.studyProgramId,
        cohortId: classes.cohortId,
        code: classes.code,
        name: classes.name,
        studyProgramName: studyPrograms.name,
        cohortYear: cohorts.year,
      })
      .from(classes)
      .innerJoin(studyPrograms, eq(classes.studyProgramId, studyPrograms.id))
      .innerJoin(cohorts, eq(classes.cohortId, cohorts.id))
      .where(
        and(
          eq(classes.isActive, true),
          eq(studyPrograms.isActive, true),
          eq(cohorts.isActive, true),
        ),
      )
      .orderBy(classes.code);

    return list;
  }

  /**
   * GET ALL CLASSES + PAGINATION, SEARCH & FILTER (Admin Panel)
   */
  static async getClasses(query: GetClassQueryInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const search = query.search?.trim() || "";
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        sql`(${ilike(classes.code, `%${search}%`)} OR ${ilike(
          classes.name,
          `%${search}%`,
        )})`,
      );
    }

    if (query.studyProgramId) {
      conditions.push(eq(classes.studyProgramId, query.studyProgramId));
    }

    if (query.cohortId) {
      conditions.push(eq(classes.cohortId, query.cohortId));
    }

    if (query.isActive !== undefined) {
      conditions.push(eq(classes.isActive, query.isActive));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [classesRaw, totalResult] = await Promise.all([
      db.query.classes.findMany({
        where: whereClause,
        with: {
          studyProgram: true,
          cohort: true,
        },
        limit,
        offset,
        orderBy: (classTable, { desc }) => [desc(classTable.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(${classes.id})` })
        .from(classes)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedList = classesRaw.map((cls) => this.mapClass(cls));

    return {
      classes: formattedList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * GET CLASS BY ID
   */
  static async getClassById(id: string): Promise<ClassResponse> {
    const cls = await db.query.classes.findFirst({
      where: eq(classes.id, id),
      with: {
        studyProgram: true,
        cohort: true,
      },
    });

    if (!cls) {
      throw new NotFoundError(`Class with ID ${id} not found`);
    }

    return this.mapClass(cls);
  }

  /**
   * CREATE CLASS + AUDIT LOG RECORD
   */
  static async createClass(
    input: CreateClassInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<ClassResponse> {
    // 1. Validasi Study Program induk ada
    const spExists = await db.query.studyPrograms.findFirst({
      where: eq(studyPrograms.id, input.studyProgramId),
    });

    if (!spExists) {
      throw new NotFoundError(
        `Study Program with ID ${input.studyProgramId} not found`,
      );
    }

    // 2. Validasi Cohort induk ada
    const cohortExists = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, input.cohortId),
    });

    if (!cohortExists) {
      throw new NotFoundError(`Cohort with ID ${input.cohortId} not found`);
    }

    // 3. Validasi kode kelas tidak duplikat
    const existingCode = await db.query.classes.findFirst({
      where: eq(classes.code, input.code),
    });

    if (existingCode) {
      throw new BadRequestError(`Class with code ${input.code} already exists`);
    }

    const [created] = await db
      .insert(classes)
      .values({
        studyProgramId: input.studyProgramId,
        cohortId: input.cohortId,
        code: input.code,
        name: input.name,
      })
      .returning();

    const result = await this.getClassById(created.id);

    await AuditLogService.record({
      actorUserId: actor?.userId || result.id,
      actorEmail: actor?.email || "system@internal",
      action: "CLASS_CREATE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "classes",
      targetId: result.id,
      ipAddress,
      details: {
        code: result.code,
        name: result.name,
        studyProgramId: result.studyProgramId,
        cohortId: result.cohortId,
      },
    });

    return result;
  }

  /**
   * UPDATE CLASS + AUDIT LOG RECORD
   */
  static async updateClass(
    id: string,
    input: UpdateClassInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<ClassResponse> {
    const existingClass = await db.query.classes.findFirst({
      where: eq(classes.id, id),
    });

    if (!existingClass) {
      throw new NotFoundError(`Class with ID ${id} not found`);
    }

    if (input.studyProgramId) {
      const spExists = await db.query.studyPrograms.findFirst({
        where: eq(studyPrograms.id, input.studyProgramId),
      });

      if (!spExists) {
        throw new NotFoundError(
          `Study Program with ID ${input.studyProgramId} not found`,
        );
      }
    }

    if (input.cohortId) {
      const cohortExists = await db.query.cohorts.findFirst({
        where: eq(cohorts.id, input.cohortId),
      });

      if (!cohortExists) {
        throw new NotFoundError(`Cohort with ID ${input.cohortId} not found`);
      }
    }

    if (input.code && input.code !== existingClass.code) {
      const codeDuplicate = await db.query.classes.findFirst({
        where: eq(classes.code, input.code),
      });

      if (codeDuplicate) {
        throw new BadRequestError(
          `Class with code ${input.code} already exists`,
        );
      }
    }

    await db
      .update(classes)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, id));

    const result = await this.getClassById(id);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "CLASS_UPDATE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "classes",
      targetId: id,
      ipAddress,
      details: {
        previousState: {
          code: existingClass.code,
          name: existingClass.name,
          studyProgramId: existingClass.studyProgramId,
          cohortId: existingClass.cohortId,
        },
        updatedFields: input,
      },
    });

    return result;
  }

  /**
   * TOGGLE STATUS IS_ACTIVE + AUDIT LOG RECORD
   */
  static async toggleStatus(
    id: string,
    input: ToggleClassStatusInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<ClassResponse> {
    const existingClass = await db.query.classes.findFirst({
      where: eq(classes.id, id),
    });

    if (!existingClass) {
      throw new NotFoundError(`Class with ID ${id} not found`);
    }

    await db
      .update(classes)
      .set({
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, id));

    const result = await this.getClassById(id);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "CLASS_TOGGLE_STATUS",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "classes",
      targetId: id,
      ipAddress,
      details: {
        previousState: { isActive: existingClass.isActive },
        newState: { isActive: input.isActive },
      },
    });

    return result;
  }

  /**
   * DELETE CLASS + AUDIT LOG RECORD
   */
  static async deleteClass(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    const existingClass = await db.query.classes.findFirst({
      where: eq(classes.id, id),
    });

    if (!existingClass) {
      throw new NotFoundError(`Class with ID ${id} not found`);
    }

    await db.delete(classes).where(eq(classes.id, id));

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "CLASS_DELETE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "classes",
      targetId: id,
      ipAddress,
      details: {
        deletedCode: existingClass.code,
        deletedName: existingClass.name,
      },
    });
  }

  private static mapClass(cls: any): ClassResponse {
    return {
      id: cls.id,
      studyProgramId: cls.studyProgramId,
      cohortId: cls.cohortId,
      code: cls.code,
      name: cls.name,
      isActive: cls.isActive,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
      studyProgram: cls.studyProgram
        ? {
            id: cls.studyProgram.id,
            code: cls.studyProgram.code,
            name: cls.studyProgram.name,
            degree: cls.studyProgram.degree,
          }
        : undefined,
      cohort: cls.cohort
        ? {
            id: cls.cohort.id,
            year: cls.cohort.year,
            name: cls.cohort.name,
          }
        : undefined,
    };
  }
}
