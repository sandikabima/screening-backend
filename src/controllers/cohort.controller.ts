import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { CohortService } from "@/services/cohort.service";
import {
  CreateCohortInput,
  GetCohortQueryInput,
  ToggleCohortStatusInput,
  UpdateCohortInput,
} from "@/types/cohort.types";
import { successResponse } from "@/utils/response";

export class CohortController {
  /**
   * GET PUBLIC COHORTS (Form Pendaftaran Mahasiswa - Non-Auth / Public)
   */
  static async getPublicCohorts(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await CohortService.getPublicCohorts();

      return successResponse(
        res,
        result,
        "Public active cohorts retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL COHORTS + PAGINATION & SEARCH (Admin Panel)
   */
  static async getCohorts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetCohortQueryInput;
      const { cohorts, pagination } =
        await CohortService.getCohorts(queryFilters);

      return successResponse(
        res,
        cohorts,
        "Cohort list retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET COHORT BY ID
   */
  static async getCohortById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const cohort = await CohortService.getCohortById(id);

      return successResponse(res, cohort, "Cohort retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * CREATE COHORT
   */
  static async createCohort(
    req: AuthenticatedRequest<any, any, CreateCohortInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      const cohort = await CohortService.createCohort(payload, actor, req.ip);

      return successResponse(res, cohort, "Cohort created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE COHORT
   */
  static async updateCohort(
    req: AuthenticatedRequest<{ id: string }, any, UpdateCohortInput>,
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

      const cohort = await CohortService.updateCohort(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(res, cohort, "Cohort updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * TOGGLE COHORT STATUS (IS_ACTIVE)
   */
  static async toggleStatus(
    req: AuthenticatedRequest<{ id: string }, any, ToggleCohortStatusInput>,
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

      const cohort = await CohortService.toggleStatus(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        cohort,
        `Cohort status updated to ${payload.isActive ? "active" : "inactive"} successfully`,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE COHORT
   */
  static async deleteCohort(
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

      await CohortService.deleteCohort(id, actor, req.ip);

      return successResponse(res, null, "Cohort deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
