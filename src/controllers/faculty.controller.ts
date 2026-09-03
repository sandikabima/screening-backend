import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { FacultyService } from "@/services/faculty.service";
import {
  CreateFacultyInput,
  GetFacultyQueryInput,
  ToggleFacultyStatusInput,
  UpdateFacultyInput,
} from "@/types/faculty.types";
import { successResponse } from "@/utils/response";

export class FacultyController {
  /**
   * GET PUBLIC FACULTIES (Form Pendaftaran Mahasiswa - Non-Auth / Public)
   */
  static async getPublicFaculties(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await FacultyService.getPublicFaculties();

      return successResponse(
        res,
        result,
        "Public active faculties retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL FACULTIES + PAGINATION & SEARCH (Admin Panel)
   */
  static async getFaculties(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetFacultyQueryInput;
      const { faculties, pagination } =
        await FacultyService.getFaculties(queryFilters);

      return successResponse(
        res,
        faculties,
        "Faculty list retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET FACULTY BY ID
   */
  static async getFacultyById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const faculty = await FacultyService.getFacultyById(id);

      return successResponse(res, faculty, "Faculty retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * CREATE FACULTY
   */
  static async createFaculty(
    req: AuthenticatedRequest<any, any, CreateFacultyInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      const faculty = await FacultyService.createFaculty(
        payload,
        actor,
        req.ip,
      );

      return successResponse(res, faculty, "Faculty created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE FACULTY
   */
  static async updateFaculty(
    req: AuthenticatedRequest<{ id: string }, any, UpdateFacultyInput>,
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

      const faculty = await FacultyService.updateFaculty(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(res, faculty, "Faculty updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * TOGGLE FACULTY STATUS (IS_ACTIVE)
   */
  static async toggleStatus(
    req: AuthenticatedRequest<{ id: string }, any, ToggleFacultyStatusInput>,
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

      const faculty = await FacultyService.toggleStatus(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        faculty,
        `Faculty status updated to ${payload.isActive ? "active" : "inactive"} successfully`,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE FACULTY
   */
  static async deleteFaculty(
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

      await FacultyService.deleteFaculty(id, actor, req.ip);

      return successResponse(res, null, "Faculty deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
