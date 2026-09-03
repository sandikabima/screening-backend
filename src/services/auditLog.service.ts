import { and, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import {
  AuditLogResponse,
  ListAuditLogsQuery,
  RecordAuditInput,
} from "@/types/audit.types";
import logger from "@/utils/logger";

export class AuditLogService {
  /**
   * RECORD AUDIT LOG (Internal Service)
   */
  static async record(input: RecordAuditInput): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        actorUserId: input.actorUserId || null,
        actorEmail: input.actorEmail || "SYSTEM",
        action: input.action,
        module: input.module,
        targetEntity: input.targetEntity || null,
        targetId: input.targetId || null,
        ipAddress: input.ipAddress || null,
        details: input.details ? JSON.stringify(input.details) : null,
      });

      logger.info(
        `[AUDIT RECORDED] ${input.action} by ${input.actorEmail || "SYSTEM"}`,
      );
    } catch (error) {
      logger.error("Failed to record audit log:", error);
    }
  }

  /**
   * FETCH AUDIT LOGS DENGAN FILTER MULTI-KRITERIA LENGKAP
   */
  static async listAuditLogs(query: ListAuditLogsQuery) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit || 20)));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // 1. Filter Modul Spesifik
    if (query.module?.trim()) {
      conditions.push(eq(auditLogs.module, query.module.trim()));
    }

    // 2. Filter Aksi Spesifik (USER_CREATE, PERMISSION_ASSIGN, dll)
    if (query.action?.trim()) {
      conditions.push(eq(auditLogs.action, query.action.trim()));
    }

    // 3. Filter Aktor (Email / User ID)
    if (query.actorEmail?.trim()) {
      conditions.push(
        ilike(
          auditLogs.actorEmail,
          `%${query.actorEmail.trim().toLowerCase()}%`,
        ),
      );
    }
    if (query.actorUserId?.trim()) {
      conditions.push(eq(auditLogs.actorUserId, query.actorUserId.trim()));
    }

    // 4. Filter Entitas Target & ID Objek
    if (query.targetEntity?.trim()) {
      conditions.push(eq(auditLogs.targetEntity, query.targetEntity.trim()));
    }
    if (query.targetId?.trim()) {
      conditions.push(eq(auditLogs.targetId, query.targetId.trim()));
    }

    // 5. Filter Rentang Waktu (Date Range)
    if (query.startDate) {
      const start = new Date(query.startDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0); // Mulai dari awal hari 00:00:00
        conditions.push(gte(auditLogs.createdAt, start));
      }
    }

    if (query.endDate) {
      const end = new Date(query.endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999); // Sampai akhir hari 23:59:59
        conditions.push(lte(auditLogs.createdAt, end));
      }
    }

    // 6. Pencarian Global (Search Bar Keyword)
    if (query.search?.trim()) {
      const searchPattern = `%${query.search.trim().toLowerCase()}%`;
      conditions.push(
        or(
          ilike(auditLogs.actorEmail, searchPattern),
          ilike(auditLogs.action, searchPattern),
          ilike(auditLogs.targetEntity, searchPattern),
          ilike(auditLogs.ipAddress, searchPattern),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const [rawLogs, totalResult] = await Promise.all([
      db.query.auditLogs.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (table, { asc, desc }) => [
          sortOrder === "asc" ? asc(table.createdAt) : desc(table.createdAt),
        ],
      }),
      db
        .select({ count: sql<number>`count(${auditLogs.id})` })
        .from(auditLogs)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    const formattedLogs: AuditLogResponse[] = rawLogs.map((log) => {
      let parsedDetails: Record<string, unknown> | null = null;

      if (log.details) {
        try {
          parsedDetails =
            typeof log.details === "string"
              ? JSON.parse(log.details)
              : (log.details as Record<string, unknown>);
        } catch {
          parsedDetails = { raw: log.details };
        }
      }

      return {
        id: log.id,
        actorUserId: log.actorUserId,
        actorEmail: log.actorEmail ?? "SYSTEM",
        action: log.action,
        module: log.module,
        targetEntity: log.targetEntity,
        targetId: log.targetId,
        ipAddress: log.ipAddress,
        details: parsedDetails,
        createdAt: log.createdAt,
      };
    });

    return {
      auditLogs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
