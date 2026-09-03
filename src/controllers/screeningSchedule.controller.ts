import { NextFunction, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { ScreeningScheduleService } from "@/services/ScreeningSchedule.service";
import {
  CreateScheduleInput,
  GetScheduleQueryInput,
  UpdateScheduleInput,
} from "@/types/screeningSchedule.types";
import { successResponse } from "@/utils/response";

export class ScreeningScheduleController {
  /**
   * CREATE SCHEDULE (ADMIN / TESTER)
   */
  static async createSchedule(
    req: AuthenticatedRequest<any, any, CreateScheduleInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      const result = await ScreeningScheduleService.createSchedule(
        payload,
        req.ip,
        actor,
      );

      return successResponse(
        res,
        result,
        "Screening schedule created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL SCHEDULES
   */
  static async getSchedules(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetScheduleQueryInput;
      const { schedules, pagination } =
        await ScreeningScheduleService.getSchedules(queryFilters);

      return successResponse(
        res,
        schedules,
        "Screening schedules retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET SCHEDULE BY ID
   */
  static async getScheduleById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const schedule = await ScreeningScheduleService.getScheduleById(id);

      return successResponse(
        res,
        schedule,
        "Screening schedule retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE SCHEDULE
   */
  static async updateSchedule(
    req: AuthenticatedRequest<{ id: string }, any, UpdateScheduleInput>,
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

      const schedule = await ScreeningScheduleService.updateSchedule(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        schedule,
        "Screening schedule updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE SCHEDULE
   */
  static async deleteSchedule(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      await ScreeningScheduleService.deleteSchedule(id, actor, req.ip);

      return successResponse(
        res,
        null,
        "Screening schedule deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}
