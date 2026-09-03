import { Router } from "express";
import { StudyProgramController } from "@/controllers/studyProgram.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  createStudyProgramSchema,
  getStudyProgramIdSchema,
  getStudyProgramQuerySchema,
  toggleStudyProgramStatusSchema,
  updateStudyProgramSchema,
} from "@/types/studyProgram";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

// ==========================================
// PUBLIC ROUTE (FORM REGISTRASI MAHASISWA - UNPROTECTED)
// ==========================================
router.get(
  "/public",
  asyncHandler(StudyProgramController.getPublicStudyPrograms),
);

// ==========================================
// ADMIN ROUTES (PROTECTED BY AUTH & RBAC)
// ==========================================
router.use(authenticate);

router.get(
  "/",
  authorizePermission("STUDY_PROGRAM_READ"),
  validateQuery(getStudyProgramQuerySchema),
  asyncHandler(StudyProgramController.getStudyPrograms),
);

router.get(
  "/:id",
  authorizePermission("STUDY_PROGRAM_READ"),
  validateParams(getStudyProgramIdSchema),
  asyncHandler(StudyProgramController.getStudyProgramById),
);

router.post(
  "/",
  authorizePermission("STUDY_PROGRAM_CREATE"),
  validateBody(createStudyProgramSchema),
  asyncHandler(StudyProgramController.createStudyProgram),
);

router.put(
  "/:id",
  authorizePermission("STUDY_PROGRAM_UPDATE"),
  validateParams(getStudyProgramIdSchema),
  validateBody(updateStudyProgramSchema),
  asyncHandler(StudyProgramController.updateStudyProgram),
);

router.patch(
  "/:id/toggle-status",
  authorizePermission("STUDY_PROGRAM_UPDATE"),
  validateParams(getStudyProgramIdSchema),
  validateBody(toggleStudyProgramStatusSchema),
  asyncHandler(StudyProgramController.toggleStatus),
);

router.delete(
  "/:id",
  authorizePermission("STUDY_PROGRAM_DELETE"),
  validateParams(getStudyProgramIdSchema),
  asyncHandler(StudyProgramController.deleteStudyProgram),
);

export default router;
