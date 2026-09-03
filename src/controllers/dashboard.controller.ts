import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "@/middleware/auth";
import { DashboardService } from "@/services/dashboard.service";
import { successResponse } from "@/utils/response";

export class DashboardController {
  /**
   * GET /api/v1/dashboard/overview
   * Menyajkan akumulasi statistik screening, sebaran P1-P4, dan status tiket follow-up
   */
  static async getOverview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const stats = await DashboardService.getOverviewStats();
      return successResponse(
        res,
        stats,
        "Statistik dashboard overview berhasil diproses",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}
