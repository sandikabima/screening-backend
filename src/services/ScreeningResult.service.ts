import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  screeningResults,
  screeningSessions,
  srqCutOffs,
  followUps,
} from "@/db/schema";
import {
  GetScreeningResultQueryInput,
  SubmitScreeningResultInput,
  RawResponsesPayload,
} from "@/types/screeningResult.types";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/utils/errors";
import { AuditLogService } from "@/services/auditLog.service";
import { normalizePositiveNumber } from "@/utils/pagination";

export class ScreeningResultService {
  /**
   * 1. SUBMIT ANSWERS & EVALUATE TRIAGE ENGINE
   */
  static async submitResult(
    studentUserId: string,
    input: SubmitScreeningResultInput,
    ipAddress?: string,
  ) {
    const { sessionId, srqAnswers, indicators, safetyFlag, m1 } = input;

    // A. Validasi Sesi & Ownership
    const session = await db.query.screeningSessions.findFirst({
      where: eq(screeningSessions.id, sessionId),
      with: { student: true },
    });

    if (!session) throw new NotFoundError("Sesi screening tidak ditemukan");
    if (session.student?.userId !== studentUserId) {
      throw new ForbiddenError("Anda tidak berhak mengakses sesi ini");
    }
    if (session.status === "Completed") {
      throw new BadRequestError("Sesi tes ini sudah selesai dikerjakan");
    }

    // B. Ambil Cut-Off SRQ Aktif
    const activeCutOff = await db.query.srqCutOffs.findFirst({
      where: eq(srqCutOffs.isActive, true),
    });
    const cutoffScore = activeCutOff?.cutoffScore ?? 8;

    // C. Kalkulasi Skor & Indikator
    const srqScore = srqAnswers.reduce((acc, val) => acc + val, 0);
    const isSrqAboveCutOff = srqScore >= cutoffScore;
    const hasHighIndicator = Object.values(indicators).some((val) => val > 0);

    // D. Decision Engine Rules (R01 - R05)
    let priorityResult: "P1" | "P2" | "P3" | "P4" = "P4";
    let reasonCode: "R01" | "R02" | "R03" | "R04" | "R05" = "R05";

    if (safetyFlag) {
      priorityResult = "P1";
      reasonCode = "R01";
    } else if (isSrqAboveCutOff) {
      priorityResult = "P2";
      reasonCode = hasHighIndicator ? "R02" : "R03";
    } else if (hasHighIndicator) {
      priorityResult = "P3";
      reasonCode = "R04";
    } else {
      priorityResult = "P4";
      reasonCode = "R05";
    }

    // Object JSONB disesuaikan dengan RawResponsesPayload
    const rawResponsesPayload: RawResponsesPayload = {
      srqAnswers,
      indicators,
      safetyFlag,
      m1,
    };

    // E. Atomic Database Transaction
    return await db.transaction(async (tx) => {
      // Insert Result ke Database
      const [newResult] = await tx
        .insert(screeningResults)
        .values({
          sessionId: session.id,
          studentId: session.studentId,
          srqCutOffId: activeCutOff?.id || null,
          rawResponses: rawResponsesPayload,
          srqScore,
          srqCutOffUsed: cutoffScore,
          isSrqAboveCutOff,
          hasHighIndicator,
          safetyFlag,
          priorityResult,
          reasonCode,
          ruleVersion: "TRIAGE-V1.0",
        })
        .returning();

      // Update Session Status -> Completed
      await tx
        .update(screeningSessions)
        .set({ status: "Completed", updatedAt: new Date() })
        .where(eq(screeningSessions.id, session.id));

      // Auto-Create Follow Up untuk P1, P2, P3
      if (["P1", "P2", "P3"].includes(priorityResult)) {
        await tx.insert(followUps).values({
          screeningResultId: newResult.id,
          status: "Belum",
          notes: `[AUTO-TRIAGE] Terdeteksi Kategori ${priorityResult} (${reasonCode})`,
        });
      }

      // Record Audit Log
      await AuditLogService.record({
        actorUserId: studentUserId,
        action: "SUBMIT_SCREENING_RESULT",
        module: "SCREENING_RESULT",
        targetEntity: "screening_results",
        targetId: newResult.id,
        ipAddress,
        details: { priorityResult, reasonCode, srqScore, safetyFlag },
      });

      return newResult;
    });
  }

  /**
   * 2. GET ALL RESULTS WITH PAGINATION & FILTER (OPTIMIZED LIST)
   */
  static async getResults(query: GetScreeningResultQueryInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (query.priorityResult) {
      conditions.push(
        eq(
          screeningResults.priorityResult,
          query.priorityResult as "P1" | "P2" | "P3" | "P4",
        ),
      );
    }

    if (query.scheduleId) {
      conditions.push(eq(screeningSessions.scheduleId, query.scheduleId));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [resultsRaw, totalResult] = await Promise.all([
      db.query.screeningResults.findMany({
        where: whereClause,
        // Sembunyikan rawResponses agar fast-loading & hemat memory
        columns: {
          id: true,
          sessionId: true,
          studentId: true,
          srqCutOffId: true,
          srqScore: true,
          srqCutOffUsed: true,
          isSrqAboveCutOff: true,
          hasHighIndicator: true,
          safetyFlag: true,
          priorityResult: true,
          reasonCode: true,
          ruleVersion: true,
          calculatedAt: true,
          rawResponses: true,
        },
        with: {
          session: {
            columns: { id: true, status: true },
            with: {
              schedule: { columns: { id: true, name: true, tanggal: true } },
            },
          },
          student: {
            columns: { id: true, nim: true, gender: true },
            with: {
              // Sanitasi Keamanan: Exclude Password Hash!
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  isActive: true,
                },
              },
              studyProgram: { columns: { id: true, name: true, code: true } },
              cohort: { columns: { id: true, year: true, name: true } },
            },
          },
          followUps: {
            columns: { id: true, status: true, notes: true, createdAt: true },
          },
        },
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.calculatedAt)],
      }),
      db
        .select({ count: sql<number>`count(${screeningResults.id})` })
        .from(screeningResults)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      results: resultsRaw,
      pagination: { page, limit, total, totalPages },
    };
  }

  /**
   * 3. GET RESULT DETAIL BY ID (INCLUDES FULL RAW RESPONSES)
   */
  static async getResultById(id: string) {
    const result = await db.query.screeningResults.findFirst({
      where: eq(screeningResults.id, id),
      with: {
        session: { with: { schedule: true } },
        student: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                isActive: true,
              },
            },
            studyProgram: true,
            cohort: true,
            class: true,
          },
        },
        followUps: true,
      },
    });

    if (!result) {
      throw new NotFoundError(
        `Hasil screening dengan ID ${id} tidak ditemukan`,
      );
    }

    return result;
  }
}
