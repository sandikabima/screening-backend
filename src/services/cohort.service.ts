import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { cohorts } from "@/db/schema";
import { UserActor } from "@/services/user.service";
import { AuditLogService } from "@/services/auditLog.service";
import {
  CohortPublicResponse,
  CohortResponse,
  CreateCohortInput,
  GetCohortQueryInput,
  ToggleCohortStatusInput,
  UpdateCohortInput,
} from "@/types/cohort.types";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { normalizePositiveNumber } from "@/utils/pagination";

export class CohortService {
  /**
   * GET PUBLIC COHORTS (Dropdown Form Registrasi Mahasiswa)
   */
  static async getPublicCohorts(): Promise<CohortPublicResponse[]> {
    const activeCohorts = await db.query.cohorts.findMany({
      where: eq(cohorts.isActive, true),
      orderBy: (cohortTable, { desc }) => [desc(cohortTable.year)],
    });

    return activeCohorts.map((c) => ({
      id: c.id,
      year: c.year,
      name: c.name,
    }));
  }

  /**
   * GET ALL COHORTS + PAGINATION & SEARCH (Admin Panel)
   */
  static async getCohorts(query: GetCohortQueryInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const search = query.search?.trim() || "";
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        sql`(${ilike(cohorts.name, `%${search}%`)} OR CAST(${cohorts.year} AS TEXT) LIKE ${`%${search}%`})`,
      );
    }

    if (query.isActive !== undefined) {
      conditions.push(eq(cohorts.isActive, query.isActive));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [cohortsRaw, totalResult] = await Promise.all([
      db.query.cohorts.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (cohortTable, { desc }) => [desc(cohortTable.year)],
      }),
      db
        .select({ count: sql<number>`count(${cohorts.id})` })
        .from(cohorts)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedCohorts = cohortsRaw.map((cohort) => this.mapCohort(cohort));

    return {
      cohorts: formattedCohorts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * GET COHORT BY ID
   */
  static async getCohortById(id: string): Promise<CohortResponse> {
    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, id),
    });

    if (!cohort) {
      throw new NotFoundError(`Cohort with ID ${id} not found`);
    }

    return this.mapCohort(cohort);
  }

  /**
   * CREATE COHORT + AUDIT LOG RECORD
   */
  static async createCohort(
    input: CreateCohortInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<CohortResponse> {
    const existingYear = await db.query.cohorts.findFirst({
      where: eq(cohorts.year, input.year),
    });

    if (existingYear) {
      throw new BadRequestError(`Cohort for year ${input.year} already exists`);
    }

    const [createdCohort] = await db
      .insert(cohorts)
      .values({
        year: input.year,
        name: input.name,
      })
      .returning();

    const result = this.mapCohort(createdCohort);

    await AuditLogService.record({
      actorUserId: actor?.userId || result.id,
      actorEmail: actor?.email || "system@internal",
      action: "COHORT_CREATE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "cohorts",
      targetId: result.id,
      ipAddress,
      details: {
        year: result.year,
        name: result.name,
      },
    });

    return result;
  }

  /**
   * UPDATE COHORT + AUDIT LOG RECORD
   */
  static async updateCohort(
    id: string,
    input: UpdateCohortInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<CohortResponse> {
    const existingCohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, id),
    });

    if (!existingCohort) {
      throw new NotFoundError(`Cohort with ID ${id} not found`);
    }

    if (input.year !== undefined && input.year !== existingCohort.year) {
      const yearDuplicate = await db.query.cohorts.findFirst({
        where: eq(cohorts.year, input.year),
      });

      if (yearDuplicate) {
        throw new BadRequestError(
          `Cohort for year ${input.year} already exists`,
        );
      }
    }

    await db
      .update(cohorts)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(cohorts.id, id));

    const updatedCohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, id),
    });

    if (!updatedCohort) {
      throw new NotFoundError(`Cohort with ID ${id} not found after update`);
    }

    const result = this.mapCohort(updatedCohort);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "COHORT_UPDATE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "cohorts",
      targetId: id,
      ipAddress,
      details: {
        previousState: {
          year: existingCohort.year,
          name: existingCohort.name,
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
    input: ToggleCohortStatusInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<CohortResponse> {
    const existingCohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, id),
    });

    if (!existingCohort) {
      throw new NotFoundError(`Cohort with ID ${id} not found`);
    }

    await db
      .update(cohorts)
      .set({
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(cohorts.id, id));

    const updatedCohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, id),
    });

    if (!updatedCohort) {
      throw new NotFoundError(
        `Cohort with ID ${id} not found after status update`,
      );
    }

    const result = this.mapCohort(updatedCohort);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "COHORT_TOGGLE_STATUS",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "cohorts",
      targetId: id,
      ipAddress,
      details: {
        previousState: { isActive: existingCohort.isActive },
        newState: { isActive: input.isActive },
      },
    });

    return result;
  }

  /**
   * DELETE COHORT + AUDIT LOG RECORD
   */
  static async deleteCohort(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    const existingCohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, id),
    });

    if (!existingCohort) {
      throw new NotFoundError(`Cohort with ID ${id} not found`);
    }

    await db.delete(cohorts).where(eq(cohorts.id, id));

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "COHORT_DELETE",
      module: "CAMPUS_MANAGEMENT",
      targetEntity: "cohorts",
      targetId: id,
      ipAddress,
      details: {
        deletedYear: existingCohort.year,
        deletedName: existingCohort.name,
      },
    });
  }

  private static mapCohort(cohort: any): CohortResponse {
    return {
      id: cohort.id,
      year: cohort.year,
      name: cohort.name,
      isActive: cohort.isActive,
      createdAt: cohort.createdAt,
      updatedAt: cohort.updatedAt,
    };
  }
}
