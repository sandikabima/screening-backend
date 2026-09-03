import { Router } from "express";
import { FacultyController } from "@/controllers/faculty.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  createFacultySchema,
  getFacultyIdSchema,
  getFacultyQuerySchema,
  toggleFacultyStatusSchema,
  updateFacultySchema,
} from "@/types/faculty.types";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

// ==========================================
// PUBLIC ROUTE (FORM REGISTRASI MAHASISWA - UNPROTECTED)
// ==========================================
router.get("/public", asyncHandler(FacultyController.getPublicFaculties));

// ==========================================
// ADMIN ROUTES (PROTECTED BY AUTH & RBAC)
// ==========================================
router.use(authenticate);

router.get(
  "/",
  authorizePermission("FACULTY_READ"),
  validateQuery(getFacultyQuerySchema),
  asyncHandler(FacultyController.getFaculties),
);

router.get(
  "/:id",
  authorizePermission("FACULTY_READ"),
  validateParams(getFacultyIdSchema),
  asyncHandler(FacultyController.getFacultyById),
);

router.post(
  "/",
  authorizePermission("FACULTY_CREATE"),
  validateBody(createFacultySchema),
  asyncHandler(FacultyController.createFaculty),
);

router.put(
  "/:id",
  authorizePermission("FACULTY_UPDATE"),
  validateParams(getFacultyIdSchema),
  validateBody(updateFacultySchema),
  asyncHandler(FacultyController.updateFaculty),
);

router.delete(
  "/:id",
  authorizePermission("FACULTY_DELETE"),
  validateParams(getFacultyIdSchema),
  asyncHandler(FacultyController.deleteFaculty),
);

router.patch(
  "/:id/toggle-status",
  authorizePermission("FACULTY_UPDATE"),
  validateParams(getFacultyIdSchema),
  validateBody(toggleFacultyStatusSchema),
  asyncHandler(FacultyController.toggleStatus),
);

export default router;
