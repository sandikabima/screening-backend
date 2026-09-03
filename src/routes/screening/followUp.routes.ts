import { Router } from "express";
import { FollowUpController } from "@/controllers/followUp.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validation";
import {
  getFollowUpsQuerySchema,
  updateFollowUpSchema,
} from "@/types/followUp.types";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  // authorizePermission("MENU_FOLLOWUP"),
  validateQuery(getFollowUpsQuerySchema),
  asyncHandler(FollowUpController.getFollowUps),
);

router.patch(
  "/:id",
  // authorizePermission("MENU_FOLLOWUP"),
  validateBody(updateFollowUpSchema),
  asyncHandler(FollowUpController.updateFollowUp),
);

export default router;
