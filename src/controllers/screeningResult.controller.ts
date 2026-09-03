import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "@/middleware/auth";
import { ScreeningResultService } from "@/services/ScreeningResult.service";
import {
  GetScreeningResultQueryInput,
  SubmitScreeningResultInput,
} from "@/types/screeningResult.types";
import { successResponse } from "@/utils/response";

export class ScreeningResultController {
  static async submit(
    req: AuthenticatedRequest<any, any, SubmitScreeningResultInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const studentUserId = req.user?.userId as string;
      const payload = req.body;

      const result = await ScreeningResultService.submitResult(
        studentUserId,
        payload,
        req.ip,
      );

      return successResponse(
        res,
        result,
        "Jawaban screening berhasil disubmit dan dievaluasi",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getResults(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetScreeningResultQueryInput;
      const { results, pagination } =
        await ScreeningResultService.getResults(queryFilters);

      return successResponse(
        res,
        results,
        "Data hasil screening berhasil diambil",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getResultById(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const result = await ScreeningResultService.getResultById(id);

      return successResponse(
        res,
        result,
        "Detail hasil screening berhasil diambil",
      );
    } catch (error) {
      next(error);
    }
  }
}
