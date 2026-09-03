import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth";
import { AuditLogService } from "@/services/auditLog.service";
import { ListAuditLogsQuery } from "@/types/audit.types";
import { successResponse } from "@/utils/response";

export class AuditLogController {
  static async listAuditLogs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as ListAuditLogsQuery;
      const { auditLogs, pagination } =
        await AuditLogService.listAuditLogs(queryFilters);

      return successResponse(
        res,
        auditLogs,
        "Audit logs retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }
}
