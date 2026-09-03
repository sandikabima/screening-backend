import { Router } from "express";
import { AuditLogController } from "@/controllers/auditLog.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";

const router = Router();

router.use(authenticate);

// Endpoint melayani query filter kompleks: /api/v1/audit-logs?module=SYSTEM_SETTING&startDate=2026-08-01&endDate=2026-08-23&action=USER_CREATE
router.get(
  "/",
  authorizePermission("SYSTEM_SETTING"),
  AuditLogController.listAuditLogs,
);

export default router;
