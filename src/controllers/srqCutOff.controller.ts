import { NextFunction, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { SrqCutOffService } from "@/services/srqCutOff.service";
import { UpdateSrqCutOffInput } from "@/types/srqCutOff.types";
import { successResponse } from "@/utils/response";

export class SrqCutOffController {
  /**
   * GET ACTIVE SRQ CUT-OFF CONFIGURATION
   */
  static async getActiveCutOff(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await SrqCutOffService.getActiveCutOff();
      return successResponse(
        res,
        data,
        "SRQ Cut-Off configuration retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE SRQ CUT-OFF CONFIGURATION (ADMIN / PSYCHOLOGIST)
   */
  static async updateCutOff(
    req: AuthenticatedRequest<{ id: string }, any, UpdateSrqCutOffInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      // PASSING ACTOR DAN IP ADDRESS KE SERVICE DENGAN PATTERN YANG SAMA
      const updatedData = await SrqCutOffService.updateCutOff(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        updatedData,
        "SRQ Cut-Off configuration updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}
