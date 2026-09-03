import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { followUps, screeningResults } from "@/db/schema";
import {
  GetFollowUpsQueryInput,
  UpdateFollowUpInput,
} from "@/types/followUp.types";
import { NotFoundError } from "@/utils/errors";
import { AuditLogService } from "@/services/auditLog.service";
import { normalizePositiveNumber } from "@/utils/pagination";

export class FollowUpService {
  /**
   * 1. GET ALL TICKETS WITH PAGINATION & FILTER
   */
  static async getFollowUps(query: GetFollowUpsQueryInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (query.status) {
      conditions.push(eq(followUps.status, query.status));
    }

    if (query.priorityResult) {
      conditions.push(
        eq(screeningResults.priorityResult, query.priorityResult),
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [tickets, totalResult] = await Promise.all([
      db.query.followUps.findMany({
        where: whereClause,
        with: {
          handledBy: {
            // 🎯 DISESUAIKAN: Menggunakan 'handledBy' sesuai Drizzle Schema
            columns: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          screeningResult: {
            with: {
              student: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                      avatarUrl: true,
                    },
                  },
                  studyProgram: {
                    columns: { id: true, name: true, code: true },
                  },
                  cohort: { columns: { id: true, year: true, name: true } },
                },
              },
            },
          },
        },
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(${followUps.id})` })
        .from(followUps)
        .leftJoin(
          screeningResults,
          eq(followUps.screeningResultId, screeningResults.id),
        )
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      tickets,
      pagination: { page, limit, total, totalPages },
    };
  }

  /**
   * 2. UPDATE FOLLOW-UP STATUS, NOTES, & HANDLED BY USER
   */
  static async updateFollowUp(
    id: string,
    actorUserId: string,
    input: UpdateFollowUpInput,
    ipAddress?: string,
  ) {
    const ticket = await db.query.followUps.findFirst({
      where: eq(followUps.id, id),
    });

    if (!ticket) {
      throw new NotFoundError(
        `Tiket follow-up dengan ID ${id} tidak ditemukan`,
      );
    }

    const staffIdToAssign = input.assignedStaffId || actorUserId;

    const [updatedTicket] = await db
      .update(followUps)
      .set({
        status: input.status,
        notes: input.notes !== undefined ? input.notes : ticket.notes,
        handledByUserId: staffIdToAssign,
        updatedAt: new Date(),
      })
      .where(eq(followUps.id, id))
      .returning();

    await AuditLogService.record({
      actorUserId,
      action: "UPDATE_FOLLOW_UP_TICKET",
      module: "FOLLOW_UP",
      targetEntity: "follow_ups",
      targetId: id,
      ipAddress,
      details: {
        previousStatus: ticket.status,
        newStatus: input.status,
        handledByUserId: staffIdToAssign,
      },
    });

    return updatedTicket;
  }
}
