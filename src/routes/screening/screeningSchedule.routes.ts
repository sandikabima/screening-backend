import { Router } from "express";
import { ScreeningScheduleController } from "@/controllers/screeningSchedule.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  createScheduleSchema,
  getScheduleIdSchema,
  getScheduleQuerySchema,
  updateScheduleSchema,
} from "@/types/screeningSchedule.types";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorizePermission("SCREENING_SCHEDULE_READ"),
  validateQuery(getScheduleQuerySchema),
  asyncHandler(ScreeningScheduleController.getSchedules),
);

router.get(
  "/:id",
  authorizePermission("SCREENING_SCHEDULE_READ"),
  validateParams(getScheduleIdSchema),
  asyncHandler(ScreeningScheduleController.getScheduleById),
);

router.post(
  "/",
  authorizePermission("SCREENING_SCHEDULE_CREATE"),
  validateBody(createScheduleSchema),
  asyncHandler(ScreeningScheduleController.createSchedule),
);

router.put(
  "/:id",
  authorizePermission("SCREENING_SCHEDULE_UPDATE"),
  validateParams(getScheduleIdSchema),
  validateBody(updateScheduleSchema),
  asyncHandler(ScreeningScheduleController.updateSchedule),
);

router.delete(
  "/:id",
  authorizePermission("SCREENING_SCHEDULE_DELETE"),
  validateParams(getScheduleIdSchema),
  asyncHandler(ScreeningScheduleController.deleteSchedule),
);

export default router;
