import { Router } from "express";
import { SrqCutOffController } from "@/controllers/srqCutOff.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import { validateBody, validateParams } from "@/middleware/validation";
import {
  getSrqCutOffIdSchema,
  updateSrqCutOffSchema,
} from "@/types/srqCutOff.types";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  authorizePermission("SCREENING_MANAGE"),
  asyncHandler(SrqCutOffController.getActiveCutOff),
);

router.put(
  "/:id",
  authorizePermission("SCREENING_MANAGE"),
  validateParams(getSrqCutOffIdSchema),
  validateBody(updateSrqCutOffSchema),
  asyncHandler(SrqCutOffController.updateCutOff),
);

export default router;
