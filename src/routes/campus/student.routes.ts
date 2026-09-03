import { Router } from "express";
import { StudentController } from "@/controllers/student.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  getStudentIdSchema,
  getStudentQuerySchema,
  registerStudentSchema,
  updateStudentSchema,
} from "@/types/student.types";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

// ==========================================
// PUBLIC ROUTE (REGISTRASI MANDIRI MAHASISWA - UNPROTECTED)
// ==========================================
router.post(
  "/register",
  validateBody(registerStudentSchema),
  asyncHandler(StudentController.registerStudent),
);

// ==========================================
// ADMIN ROUTES (PROTECTED BY AUTH & RBAC)
// ==========================================
router.use(authenticate);

router.get(
  "/",
  authorizePermission("STUDENT_READ"),
  validateQuery(getStudentQuerySchema),
  asyncHandler(StudentController.getStudents),
);

router.get(
  "/:id",
  authorizePermission("STUDENT_READ"),
  validateParams(getStudentIdSchema),
  asyncHandler(StudentController.getStudentById),
);

router.post(
  "/",
  authorizePermission("STUDENT_CREATE"),
  validateBody(registerStudentSchema),
  asyncHandler(StudentController.registerStudent),
);

router.put(
  "/:id",
  authorizePermission("STUDENT_UPDATE"),
  validateParams(getStudentIdSchema),
  validateBody(updateStudentSchema),
  asyncHandler(StudentController.updateStudent),
);

router.delete(
  "/:id",
  authorizePermission("STUDENT_DELETE"),
  validateParams(getStudentIdSchema),
  asyncHandler(StudentController.deleteStudent),
);

export default router;
