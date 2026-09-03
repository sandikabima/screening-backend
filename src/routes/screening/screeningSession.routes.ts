import { Router } from "express";
import { ScreeningSessionController } from "@/controllers/screeningSession.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  getSessionIdSchema,
  getSessionQuerySchema,
  verifyBarcodeSchema,
} from "@/types/screeningSession.types";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

router.use(authenticate);

router.post(
  "/verify-barcode",
  authorizePermission("SCREENING_SESSION_CREATE"),
  validateBody(verifyBarcodeSchema),
  asyncHandler(ScreeningSessionController.verifyBarcode),
);

router.get(
  "/",
  authorizePermission("SCREENING_SESSION_READ"),
  validateQuery(getSessionQuerySchema),
  asyncHandler(ScreeningSessionController.getSessions),
);

router.get(
  "/:id",
  authorizePermission("SCREENING_SESSION_READ"),
  validateParams(getSessionIdSchema),
  asyncHandler(ScreeningSessionController.getSessionById),
);

router.delete(
  "/:id",
  authorizePermission("SCREENING_SESSION_DELETE"),
  validateParams(getSessionIdSchema),
  asyncHandler(ScreeningSessionController.deleteSession),
);

export default router;
