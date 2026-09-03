import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { faculties, studyPrograms } from "@/db/schema";
import { UserActor } from "@/services/user.service";
import { AuditLogService } from "@/services/auditLog.service";
import {
  CreateStudyProgramInput,
  GetStudyProgramQueryInput,
  StudyProgramPublicResponse,
  StudyProgramResponse,
  ToggleStudyProgramStatusInput,
  UpdateStudyProgramInput,
} from "@/types/studyProgram";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { normalizePositiveNumber } from "@/utils/pagination";

export class StudyProgramService {
  /**
   * GET PUBLIC STUDY PROGRAMS (Dropdown Pendaftaran Mahasiswa)
   */
  static async getPublicStudyPrograms(): Promise<StudyProgramPublicResponse[]> {
    const list = await db
      .select({
        id: studyPrograms.id,
        facultyId: studyPrograms.facultyId,
        code: studyPrograms.code,
        name: studyPrograms.name,
        degree: studyPrograms.degree,
        facultyName: faculties.name,
      })
      .from(studyPrograms)
      .innerJoin(faculties, eq(studyPrograms.facultyId, faculties.id))
      .where(
        and(
          eq(studyPrograms.isActive, true),
          eq(faculties.isActive, true), // Fakultas induk juga harus aktif
        ),
      )
      .orderBy(studyPrograms.code);

    return list;
  }

  /**
   * GET ALL STUDY PROGRAMS + PAGINATION & SEARCH (Admin Panel)
   */
  static async getStudyPrograms(query: GetStudyProgramQueryInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const search = query.search?.trim() || "";
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        sql`(${ilike(studyPrograms.code, `%${search}%`)} OR ${ilike(
          studyPrograms.name,
          `%${search}%`,
        )})`,
      );
    }

    if (query.facultyId) {
      conditions.push(eq(studyPrograms.facultyId, query.facultyId));
    }

    if (query.isActive !== undefined) {
      conditions.push(eq(studyPrograms.isActive, query.isActive));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [studyProgramsRaw, totalResult] = await Promise.all([
      db.query.studyPrograms.findMany({
        where: whereClause,
        with: {
          faculty: true,
        },
        limit,
        offset,
        orderBy: (spTable, { desc }) => [desc(spTable.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(${studyPrograms.id})` })
        .from(studyPrograms)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedList = studyProgramsRaw.map((sp) =>
      this.mapStudyProgram(sp),
    );

    return {
      studyPrograms: formattedList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * GET STUDY PROGRAM BY ID
   */
  static async getStudyProgramById(id: string): Promise<StudyProgramResponse> {
    const sp = await db.query.studyPrograms.findFirst({
      where: eq(studyPrograms.id, id),
      with: {
        faculty: true,
      },
    });

    if (!sp) {
      throw new NotFoundError(`Study Program with ID ${id} not found`);
    }

    return this.mapStudyProgram(sp);
  }

  /**
   * CREATE STUDY PROGRAM + AUDIT LOG RECORD
   */
  static async createStudyProgram(
    input: CreateStudyProgramInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<StudyProgramResponse> {
    // 1. Validasi fakultas induk ada
    const facultyExists = await db.query.faculties.findFirst({
      where: eq(faculties.id, input.facultyId),
    });

    if (!facultyExists) {
      throw new NotFoundError(`Faculty with ID ${input.facultyId} not found`);
    }

    // 2. Validasi kode prodi tidak duplikat
    const existingCode = await db.query.studyPrograms.findFirst({
      where: eq(studyPrograms.code, input.code),
    });

    if (existingCode) {
      throw new BadRequestError(
        `Study program with code ${input.code} already exists`,
      );
    }

    const [created] = await db
      .insert(studyPrograms)
      .values({
        facultyId: input.facultyId,
        code: input.code,
        name: input.name,
        degree: input.degree,
      })
      .returning();

    const result = await this.getStudyProgramById(created.id);

    // 3. Rekam Audit Log
    await AuditLogService.record({
      actorUserId: actor?.userId || result.id,
      actorEmail: actor?.email || "system@internal",
      action: "STUDY_PROGRAM_CREATE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "study_programs",
      targetId: result.id,
      ipAddress,
      details: {
        code: result.code,
        name: result.name,
        degree: result.degree,
        facultyId: result.facultyId,
      },
    });

    return result;
  }

  /**
   * UPDATE STUDY PROGRAM + AUDIT LOG RECORD
   */
  static async updateStudyProgram(
    id: string,
    input: UpdateStudyProgramInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<StudyProgramResponse> {
    const existingSp = await db.query.studyPrograms.findFirst({
      where: eq(studyPrograms.id, id),
    });

    if (!existingSp) {
      throw new NotFoundError(`Study Program with ID ${id} not found`);
    }

    if (input.facultyId) {
      const facultyExists = await db.query.faculties.findFirst({
        where: eq(faculties.id, input.facultyId),
      });

      if (!facultyExists) {
        throw new NotFoundError(`Faculty with ID ${input.facultyId} not found`);
      }
    }

    if (input.code && input.code !== existingSp.code) {
      const codeDuplicate = await db.query.studyPrograms.findFirst({
        where: eq(studyPrograms.code, input.code),
      });

      if (codeDuplicate) {
        throw new BadRequestError(
          `Study program with code ${input.code} already exists`,
        );
      }
    }

    await db
      .update(studyPrograms)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(studyPrograms.id, id));

    const result = await this.getStudyProgramById(id);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "STUDY_PROGRAM_UPDATE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "study_programs",
      targetId: id,
      ipAddress,
      details: {
        previousState: {
          code: existingSp.code,
          name: existingSp.name,
          degree: existingSp.degree,
          facultyId: existingSp.facultyId,
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
    input: ToggleStudyProgramStatusInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<StudyProgramResponse> {
    const existingSp = await db.query.studyPrograms.findFirst({
      where: eq(studyPrograms.id, id),
    });

    if (!existingSp) {
      throw new NotFoundError(`Study Program with ID ${id} not found`);
    }

    await db
      .update(studyPrograms)
      .set({
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(studyPrograms.id, id));

    const result = await this.getStudyProgramById(id);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "STUDY_PROGRAM_TOGGLE_STATUS",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "study_programs",
      targetId: id,
      ipAddress,
      details: {
        previousState: { isActive: existingSp.isActive },
        newState: { isActive: input.isActive },
      },
    });

    return result;
  }

  /**
   * DELETE STUDY PROGRAM + AUDIT LOG RECORD
   */
  static async deleteStudyProgram(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    const existingSp = await db.query.studyPrograms.findFirst({
      where: eq(studyPrograms.id, id),
    });

    if (!existingSp) {
      throw new NotFoundError(`Study Program with ID ${id} not found`);
    }

    await db.delete(studyPrograms).where(eq(studyPrograms.id, id));

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "STUDY_PROGRAM_DELETE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "study_programs",
      targetId: id,
      ipAddress,
      details: {
        deletedCode: existingSp.code,
        deletedName: existingSp.name,
      },
    });
  }

  private static mapStudyProgram(sp: any): StudyProgramResponse {
    return {
      id: sp.id,
      facultyId: sp.facultyId,
      code: sp.code,
      name: sp.name,
      degree: sp.degree,
      isActive: sp.isActive,
      createdAt: sp.createdAt,
      updatedAt: sp.updatedAt,
      faculty: sp.faculty
        ? {
            id: sp.faculty.id,
            code: sp.faculty.code,
            name: sp.faculty.name,
          }
        : undefined,
    };
  }
}
