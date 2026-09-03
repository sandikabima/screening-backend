import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";
import { DashboardController } from "@/controllers/dashboard.controller";

const router = Router();

// Proteksi seluruh endpoint dashboard dengan middleware autentikasi JWT
router.use(authenticate);

router.get("/overview", asyncHandler(DashboardController.getOverview));

export default router;
