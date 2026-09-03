import { AuthController } from "@/controllers/auth.controller";
import { authenticate } from "@/middleware/auth";
import { validateBody } from "@/middleware/validation";
import { loginSchema, refreshSchema } from "@/types/auth";
import { asyncHandler } from "@/utils/async-handler";
import { Router } from "express";

const router = Router();

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(AuthController.login),
);
router.post(
  "/logout",
  authenticate,
  validateBody(refreshSchema),
  asyncHandler(AuthController.logout),
);
router.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(AuthController.refresh),
);
router.get("/me", authenticate, asyncHandler(AuthController.getMe));

export default router;
