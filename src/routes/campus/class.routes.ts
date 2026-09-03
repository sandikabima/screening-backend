import { Router } from "express";
import { ClassController } from "@/controllers/class.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  createClassSchema,
  getClassIdSchema,
  getClassQuerySchema,
  toggleClassStatusSchema,
  updateClassSchema,
} from "@/types/class.types";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

// ==========================================
// PUBLIC ROUTE (FORM REGISTRASI MAHASISWA - UNPROTECTED)
// ==========================================
router.get("/public", asyncHandler(ClassController.getPublicClasses));

// ==========================================
// ADMIN ROUTES (PROTECTED BY AUTH & RBAC)
// ==========================================
router.use(authenticate);

router.get(
  "/",
  authorizePermission("CLASS_READ"),
  validateQuery(getClassQuerySchema),
  asyncHandler(ClassController.getClasses),
);

router.get(
  "/:id",
  authorizePermission("CLASS_READ"),
  validateParams(getClassIdSchema),
  asyncHandler(ClassController.getClassById),
);

router.post(
  "/",
  authorizePermission("CLASS_CREATE"),
  validateBody(createClassSchema),
  asyncHandler(ClassController.createClass),
);

router.put(
  "/:id",
  authorizePermission("CLASS_UPDATE"),
  validateParams(getClassIdSchema),
  validateBody(updateClassSchema),
  asyncHandler(ClassController.updateClass),
);

router.patch(
  "/:id/toggle-status",
  authorizePermission("CLASS_UPDATE"),
  validateParams(getClassIdSchema),
  validateBody(toggleClassStatusSchema),
  asyncHandler(ClassController.toggleStatus),
);

router.delete(
  "/:id",
  authorizePermission("CLASS_DELETE"),
  validateParams(getClassIdSchema),
  asyncHandler(ClassController.deleteClass),
);

export default router;
