import { Router } from "express";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import { asyncHandler } from "@/utils/async-handler";
import { QuestionController } from "../../controllers/question.controller";
import {
  getQuestionIdSchema,
  getQuestionsQuerySchema,
  toggleQuestionStatusSchema,
  updateQuestionSchema,
} from "../../types/question.types";

const router = Router();

// ==========================================
// STUDENT / PUBLIC ROUTE (FORM SCREENING MAHASISWA)
// ==========================================
// Mendukung filter ?category=SRQ atau ?category=INTI untuk pengisian kuesioner
router.get(
  "/public",
  validateQuery(getQuestionsQuerySchema),
  asyncHandler(QuestionController.getQuestions),
);

// ==========================================
// ADMIN / PSYCHOLOGIST ROUTES (PROTECTED BY AUTH & RBAC)
// ==========================================
router.use(authenticate);

router.get(
  "/",
  authorizePermission("QUESTION_READ"),
  validateQuery(getQuestionsQuerySchema),
  asyncHandler(QuestionController.getQuestions),
);

router.get(
  "/:id",
  authorizePermission("QUESTION_READ"),
  validateParams(getQuestionIdSchema),
  asyncHandler(QuestionController.getQuestionById),
);

router.put(
  "/:id",
  authorizePermission("QUESTION_UPDATE"),
  validateParams(getQuestionIdSchema),
  validateBody(updateQuestionSchema),
  asyncHandler(QuestionController.updateQuestionText),
);

router.patch(
  "/:id/toggle-status",
  authorizePermission("QUESTION_UPDATE"),
  validateParams(getQuestionIdSchema),
  validateBody(toggleQuestionStatusSchema),
  asyncHandler(QuestionController.toggleQuestionStatus),
);

export default router;
