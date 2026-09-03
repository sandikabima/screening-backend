import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "@/middleware/auth";
import { FollowUpService } from "@/services/followUp.service";
import {
  GetFollowUpsQueryInput,
  UpdateFollowUpInput,
} from "@/types/followUp.types";
import { successResponse } from "@/utils/response";

export class FollowUpController {
  static async getFollowUps(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetFollowUpsQueryInput;
      const { tickets, pagination } =
        await FollowUpService.getFollowUps(queryFilters);

      return successResponse(
        res,
        tickets,
        "Data tiket follow-up berhasil diambil",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateFollowUp(
    req: AuthenticatedRequest<{ id: string }, any, UpdateFollowUpInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const actorUserId = req.user?.userId as string;
      const payload = req.body;

      const result = await FollowUpService.updateFollowUp(
        id,
        actorUserId,
        payload,
        req.ip,
      );

      return successResponse(
        res,
        result,
        "Status tiket follow-up berhasil diperbarui",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}
