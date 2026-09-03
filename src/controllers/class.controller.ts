import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { ClassService } from "@/services/class.service";
import {
  CreateClassInput,
  GetClassQueryInput,
  ToggleClassStatusInput,
  UpdateClassInput,
} from "@/types/class.types";
import { successResponse } from "@/utils/response";

export class ClassController {
  /**
   * GET PUBLIC CLASSES (Form Registrasi / Screening Mahasiswa)
   */
  static async getPublicClasses(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await ClassService.getPublicClasses();

      return successResponse(
        res,
        result,
        "Public active classes retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL CLASSES + PAGINATION, SEARCH & FILTER (Admin Panel)
   */
  static async getClasses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetClassQueryInput;
      const { classes, pagination } =
        await ClassService.getClasses(queryFilters);

      return successResponse(
        res,
        classes,
        "Class list retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET CLASS BY ID
   */
  static async getClassById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const cls = await ClassService.getClassById(id);

      return successResponse(res, cls, "Class retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * CREATE CLASS
   */
  static async createClass(
    req: AuthenticatedRequest<any, any, CreateClassInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      const cls = await ClassService.createClass(payload, actor, req.ip);

      return successResponse(res, cls, "Class created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE CLASS
   */
  static async updateClass(
    req: AuthenticatedRequest<{ id: string }, any, UpdateClassInput>,
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

      const cls = await ClassService.updateClass(id, payload, actor, req.ip);

      return successResponse(res, cls, "Class updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * TOGGLE CLASS STATUS (IS_ACTIVE)
   */
  static async toggleStatus(
    req: AuthenticatedRequest<{ id: string }, any, ToggleClassStatusInput>,
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

      const cls = await ClassService.toggleStatus(id, payload, actor, req.ip);

      return successResponse(
        res,
        cls,
        `Class status updated to ${payload.isActive ? "active" : "inactive"} successfully`,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE CLASS
   */
  static async deleteClass(
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

      await ClassService.deleteClass(id, actor, req.ip);

      return successResponse(res, null, "Class deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
