import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { StudyProgramService } from "@/services/studyProgram.service";
import {
  CreateStudyProgramInput,
  GetStudyProgramQueryInput,
  ToggleStudyProgramStatusInput,
  UpdateStudyProgramInput,
} from "@/types/studyProgram";
import { successResponse } from "@/utils/response";

export class StudyProgramController {
  /**
   * GET PUBLIC STUDY PROGRAMS (Form Pendaftaran Mahasiswa)
   */
  static async getPublicStudyPrograms(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await StudyProgramService.getPublicStudyPrograms();

      return successResponse(
        res,
        result,
        "Public active study programs retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL STUDY PROGRAMS + PAGINATION & SEARCH (Admin Panel)
   */
  static async getStudyPrograms(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetStudyProgramQueryInput;
      const { studyPrograms, pagination } =
        await StudyProgramService.getStudyPrograms(queryFilters);

      return successResponse(
        res,
        studyPrograms,
        "Study program list retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET STUDY PROGRAM BY ID
   */
  static async getStudyProgramById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const sp = await StudyProgramService.getStudyProgramById(id);

      return successResponse(res, sp, "Study program retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * CREATE STUDY PROGRAM
   */
  static async createStudyProgram(
    req: AuthenticatedRequest<any, any, CreateStudyProgramInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      const sp = await StudyProgramService.createStudyProgram(
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        sp,
        "Study program created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE STUDY PROGRAM
   */
  static async updateStudyProgram(
    req: AuthenticatedRequest<{ id: string }, any, UpdateStudyProgramInput>,
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

      const sp = await StudyProgramService.updateStudyProgram(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(res, sp, "Study program updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * TOGGLE STATUS IS_ACTIVE
   */
  static async toggleStatus(
    req: AuthenticatedRequest<
      { id: string },
      any,
      ToggleStudyProgramStatusInput
    >,
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

      const sp = await StudyProgramService.toggleStatus(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        sp,
        `Study program status updated to ${payload.isActive ? "active" : "inactive"} successfully`,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE STUDY PROGRAM
   */
  static async deleteStudyProgram(
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

      await StudyProgramService.deleteStudyProgram(id, actor, req.ip);

      return successResponse(res, null, "Study program deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
