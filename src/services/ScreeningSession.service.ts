import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { screeningSchedules, screeningSessions, students } from "@/db/schema";
import { UserActor } from "@/services/user.service";
import { AuditLogService } from "@/services/auditLog.service";
import {
  GetSessionQueryInput,
  ScreeningSessionResponse,
  VerifyBarcodeInput,
} from "@/types/screeningSession.types";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/utils/errors";
import { normalizePositiveNumber } from "@/utils/pagination";

export class ScreeningSessionService {
  /**
   * VERIFY BARCODE & START SCREENING SESSION (MAHASISWA)
   */
  static async verifyBarcodeAndStartSession(
    studentUserId: string,
    input: VerifyBarcodeInput,
    ipAddress?: string,
  ): Promise<ScreeningSessionResponse> {
    // 1. Dapatkan profil student berdasarkan Logged-in User
    const student = await db.query.students.findFirst({
      where: eq(students.userId, studentUserId),
    });

    if (!student) {
      throw new NotFoundError("Student profile not found for this account");
    }

    // 2. RESTRIKSI STRICT: Cek apakah Mahasiswa SUDAH PERNAH screening
    const existingSession = await db.query.screeningSessions.findFirst({
      where: eq(screeningSessions.studentId, student.id),
    });

    if (existingSession) {
      throw new BadRequestError(
        "You have already completed or started a screening session",
      );
    }

    // 3. Cek keberadaan Barcode & Status ACTIVE
    const schedule = await db.query.screeningSchedules.findFirst({
      where: and(
        eq(screeningSchedules.barcodeValue, input.barcodeValue),
        eq(screeningSchedules.statusBarcode, "ACTIVE"),
      ),
    });

    if (!schedule) {
      throw new BadRequestError(
        "Invalid barcode or screening schedule is not active",
      );
    }

    // 4. Inisialisasi Sesi Screening Baru
    const [newSession] = await db
      .insert(screeningSessions)
      .values({
        scheduleId: schedule.id,
        studentId: student.id,
        status: "In_Progress",
      })
      .returning();

    // 5. Record Audit Log
    await AuditLogService.record({
      actorUserId: studentUserId,
      action: "SESSION_START",
      module: "SCREENING_SESSION",
      targetEntity: "screening_sessions",
      targetId: newSession.id,
      ipAddress,
      details: {
        scheduleId: schedule.id,
        studentId: student.id,
        barcodeValue: input.barcodeValue,
      },
    });

    return this.mapSession(newSession, schedule, student);
  }

  /**
   * GET ALL SESSIONS + PAGINATION & FILTER (ADMIN / TESTER)
   */
  static async getSessions(query: GetSessionQueryInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (query.scheduleId) {
      conditions.push(eq(screeningSessions.scheduleId, query.scheduleId));
    }

    if (query.studentId) {
      conditions.push(eq(screeningSessions.studentId, query.studentId));
    }

    if (query.status) {
      conditions.push(eq(screeningSessions.status, query.status));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [sessionsRaw, totalResult] = await Promise.all([
      db.query.screeningSessions.findMany({
        where: whereClause,
        with: {
          schedule: true,
          student: {
            with: { user: true },
          },
        },
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(${screeningSessions.id})` })
        .from(screeningSessions)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      sessions: sessionsRaw.map((s) =>
        this.mapSession(s, s.schedule, s.student),
      ),
      pagination: { page, limit, total, totalPages },
    };
  }

  /**
   * GET SESSION BY ID (WITH OWNERSHIP CHECK FOR STUDENT)
   */
  static async getSessionById(
    id: string,
    actor?: UserActor,
    userRole?: string,
  ): Promise<ScreeningSessionResponse> {
    const session = await db.query.screeningSessions.findFirst({
      where: eq(screeningSessions.id, id),
      with: {
        schedule: true,
        student: {
          with: { user: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundError(`Screening Session with ID ${id} not found`);
    }

    // Proteksi Ownership: Jika Mahasiswa (STUDENT), pastikan ini adalah sesinya sendiri
    if (userRole === "STUDENT" && session.student?.userId !== actor?.userId) {
      throw new ForbiddenError("You are not allowed to access this session");
    }

    return this.mapSession(session, session.schedule, session.student);
  }

  /**
   * DELETE SESSION (ADMIN ONLY)
   */
  static async deleteSession(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    const existingSession = await db.query.screeningSessions.findFirst({
      where: eq(screeningSessions.id, id),
    });

    if (!existingSession) {
      throw new NotFoundError(`Screening Session with ID ${id} not found`);
    }

    await db.delete(screeningSessions).where(eq(screeningSessions.id, id));

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "SESSION_DELETE",
      module: "SCREENING_SESSION",
      targetEntity: "screening_sessions",
      targetId: id,
      ipAddress,
      details: {
        studentId: existingSession.studentId,
        scheduleId: existingSession.scheduleId,
      },
    });
  }

  private static mapSession(
    sess: any,
    sched?: any,
    stud?: any,
  ): ScreeningSessionResponse {
    return {
      id: sess.id,
      scheduleId: sess.scheduleId,
      studentId: sess.studentId,
      status: sess.status,
      createdAt: sess.createdAt,
      updatedAt: sess.updatedAt,
      schedule: sched
        ? {
            id: sched.id,
            name: sched.name,
            tanggal: sched.tanggal,
            jamMulai: sched.jamMulai,
            jamSelesai: sched.jamSelesai,
            statusBarcode: sched.statusBarcode,
          }
        : undefined,
      student: stud
        ? {
            id: stud.id,
            nim: stud.nim,
            userId: stud.userId,
            user: stud.user
              ? {
                  id: stud.user.id,
                  name: stud.user.name,
                  email: stud.user.email,
                }
              : undefined,
          }
        : undefined,
    };
  }
}
