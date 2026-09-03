import { Router } from "express";
import { ScreeningResultController } from "@/controllers/screeningResult.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validation";
import {
  getScreeningResultQuerySchema,
  submitScreeningResultSchema,
} from "@/types/screeningResult.types";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

router.use(authenticate);

router.post(
  "/submit",
  authorizePermission("SCREENING_SESSION_CREATE"),
  validateBody(submitScreeningResultSchema),
  asyncHandler(ScreeningResultController.submit),
);

router.get(
  "/",
  authorizePermission("SCREENING_SCHEDULE_READ"),
  validateQuery(getScreeningResultQuerySchema),
  asyncHandler(ScreeningResultController.getResults),
);

router.get(
  "/:id",
  authorizePermission("SCREENING_SCHEDULE_READ"),
  asyncHandler(ScreeningResultController.getResultById),
);

export default router;
