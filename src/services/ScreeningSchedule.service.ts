import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { screeningSchedules, users } from "@/db/schema";
import { UserActor } from "@/services/user.service";
import { AuditLogService } from "@/services/auditLog.service";
import {
  CreateScheduleInput,
  GetScheduleQueryInput,
  ScreeningScheduleResponse,
  UpdateScheduleInput,
} from "@/types/screeningSchedule.types";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { normalizePositiveNumber } from "@/utils/pagination";

export class ScreeningScheduleService {
  /**
   * CREATE NEW SCREENING SCHEDULE (ADMIN / TESTER)
   */
  static async createSchedule(
    input: CreateScheduleInput,
    ipAddress?: string,
    actor?: UserActor,
  ): Promise<ScreeningScheduleResponse> {
    // 1. Validasi Keberadaan Tester User
    const testerExists = await db.query.users.findFirst({
      where: eq(users.id, input.testerId),
    });

    if (!testerExists) {
      throw new NotFoundError(`Tester with ID ${input.testerId} not found`);
    }

    // 2. Validasi Keunikan Barcode Value
    const existingBarcode = await db.query.screeningSchedules.findFirst({
      where: eq(screeningSchedules.barcodeValue, input.barcodeValue),
    });

    if (existingBarcode) {
      throw new BadRequestError(
        `Barcode value '${input.barcodeValue}' is already registered`,
      );
    }

    // 3. Insert Schedule Baru
    const [newSchedule] = await db
      .insert(screeningSchedules)
      .values({
        name: input.name,
        tanggal: input.tanggal,
        jamMulai: input.jamMulai,
        jamSelesai: input.jamSelesai,
        testerId: input.testerId,
        barcodeValue: input.barcodeValue,
        statusBarcode: "ACTIVE",
      })
      .returning();

    const result = await this.getScheduleById(newSchedule.id);

    // 4. Record Audit Log
    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "SCHEDULE_CREATE",
      module: "SCREENING_SCHEDULE",
      targetEntity: "screening_schedules",
      targetId: result.id,
      ipAddress,
      details: {
        name: result.name,
        barcodeValue: result.barcodeValue,
        testerId: result.testerId,
      },
    });

    return result;
  }

  /**
   * GET ALL SCHEDULES + PAGINATION, SEARCH & FILTER
   */
  static async getSchedules(query: GetScheduleQueryInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const search = query.search?.trim() || "";
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        sql`(screening_schedules.name ILIKE ${searchPattern} OR screening_schedules.barcode_value ILIKE ${searchPattern})`,
      );
    }

    if (query.statusBarcode) {
      conditions.push(
        eq(screeningSchedules.statusBarcode, query.statusBarcode),
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [schedulesRaw, totalResult] = await Promise.all([
      db.query.screeningSchedules.findMany({
        where: whereClause,
        with: {
          tester: true,
        },
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(${screeningSchedules.id})` })
        .from(screeningSchedules)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      schedules: schedulesRaw.map((s) => this.mapSchedule(s)),
      pagination: { page, limit, total, totalPages },
    };
  }

  /**
   * GET SCHEDULE BY ID
   */
  static async getScheduleById(id: string): Promise<ScreeningScheduleResponse> {
    const schedule = await db.query.screeningSchedules.findFirst({
      where: eq(screeningSchedules.id, id),
      with: { tester: true },
    });

    if (!schedule) {
      throw new NotFoundError(`Screening Schedule with ID ${id} not found`);
    }

    return this.mapSchedule(schedule);
  }

  /**
   * UPDATE SCHEDULE
   */
  static async updateSchedule(
    id: string,
    input: UpdateScheduleInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<ScreeningScheduleResponse> {
    const existingSchedule = await db.query.screeningSchedules.findFirst({
      where: eq(screeningSchedules.id, id),
    });

    if (!existingSchedule) {
      throw new NotFoundError(`Screening Schedule with ID ${id} not found`);
    }

    if (input.testerId) {
      const testerExists = await db.query.users.findFirst({
        where: eq(users.id, input.testerId),
      });

      if (!testerExists) {
        throw new NotFoundError(`Tester with ID ${input.testerId} not found`);
      }
    }

    if (
      input.barcodeValue &&
      input.barcodeValue !== existingSchedule.barcodeValue
    ) {
      const barcodeExists = await db.query.screeningSchedules.findFirst({
        where: eq(screeningSchedules.barcodeValue, input.barcodeValue),
      });

      if (barcodeExists) {
        throw new BadRequestError(
          `Barcode value '${input.barcodeValue}' is already in use`,
        );
      }
    }

    await db
      .update(screeningSchedules)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(screeningSchedules.id, id));

    const result = await this.getScheduleById(id);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "SCHEDULE_UPDATE",
      module: "SCREENING_SCHEDULE",
      targetEntity: "screening_schedules",
      targetId: id,
      ipAddress,
      details: { updatedFields: input },
    });

    return result;
  }

  /**
   * DELETE SCHEDULE
   */
  static async deleteSchedule(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    const existingSchedule = await db.query.screeningSchedules.findFirst({
      where: eq(screeningSchedules.id, id),
    });

    if (!existingSchedule) {
      throw new NotFoundError(`Screening Schedule with ID ${id} not found`);
    }

    await db.delete(screeningSchedules).where(eq(screeningSchedules.id, id));

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "SCHEDULE_DELETE",
      module: "SCREENING_SCHEDULE",
      targetEntity: "screening_schedules",
      targetId: id,
      ipAddress,
      details: { name: existingSchedule.name },
    });
  }

  private static mapSchedule(s: any): ScreeningScheduleResponse {
    return {
      id: s.id,
      name: s.name,
      tanggal: s.tanggal,
      jamMulai: s.jamMulai,
      jamSelesai: s.jamSelesai,
      testerId: s.testerId,
      barcodeValue: s.barcodeValue,
      statusBarcode: s.statusBarcode,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      tester: s.tester
        ? {
            id: s.tester.id,
            name: s.tester.name,
            email: s.tester.email,
          }
        : undefined,
    };
  }
}
