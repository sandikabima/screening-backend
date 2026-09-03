import { Router } from "express";
import { CohortController } from "@/controllers/cohort.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  createCohortSchema,
  getCohortIdSchema,
  getCohortQuerySchema,
  toggleCohortStatusSchema,
  updateCohortSchema,
} from "@/types/cohort.types";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

// ==========================================
// PUBLIC ROUTE (FORM REGISTRASI MAHASISWA - UNPROTECTED)
// ==========================================
router.get("/public", asyncHandler(CohortController.getPublicCohorts));

// ==========================================
// ADMIN ROUTES (PROTECTED BY AUTH & RBAC)
// ==========================================
router.use(authenticate);

router.get(
  "/",
  authorizePermission("COHORT_READ"),
  validateQuery(getCohortQuerySchema),
  asyncHandler(CohortController.getCohorts),
);

router.get(
  "/:id",
  authorizePermission("COHORT_READ"),
  validateParams(getCohortIdSchema),
  asyncHandler(CohortController.getCohortById),
);

router.post(
  "/",
  authorizePermission("COHORT_CREATE"),
  validateBody(createCohortSchema),
  asyncHandler(CohortController.createCohort),
);

router.put(
  "/:id",
  authorizePermission("COHORT_UPDATE"),
  validateParams(getCohortIdSchema),
  validateBody(updateCohortSchema),
  asyncHandler(CohortController.updateCohort),
);

router.patch(
  "/:id/toggle-status",
  authorizePermission("COHORT_UPDATE"),
  validateParams(getCohortIdSchema),
  validateBody(toggleCohortStatusSchema),
  asyncHandler(CohortController.toggleStatus),
);

router.delete(
  "/:id",
  authorizePermission("COHORT_DELETE"),
  validateParams(getCohortIdSchema),
  asyncHandler(CohortController.deleteCohort),
);

export default router;
