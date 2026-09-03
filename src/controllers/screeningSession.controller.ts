import { NextFunction, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { ScreeningSessionService } from "@/services/ScreeningSession.service";
import {
  GetSessionQueryInput,
  VerifyBarcodeInput,
} from "@/types/screeningSession.types";
import { successResponse } from "@/utils/response";

export class ScreeningSessionController {
  /**
   * VERIFY BARCODE & START SESSION (MAHASISWA)
   */
  static async verifyBarcode(
    req: AuthenticatedRequest<any, any, VerifyBarcodeInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body;
      const studentUserId = req.user?.userId as string;

      const result = await ScreeningSessionService.verifyBarcodeAndStartSession(
        studentUserId,
        payload,
        req.ip,
      );

      return successResponse(
        res,
        result,
        "Barcode verified, screening session started successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL SESSIONS (ADMIN / TESTER)
   */
  static async getSessions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetSessionQueryInput;
      const { sessions, pagination } =
        await ScreeningSessionService.getSessions(queryFilters);

      return successResponse(
        res,
        sessions,
        "Screening sessions retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET SESSION BY ID (MAHASISWA & ADMIN)
   */
  static async getSessionById(
    req: AuthenticatedRequest<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };
      const userRole = req.user?.role;

      const session = await ScreeningSessionService.getSessionById(
        id,
        actor,
        userRole,
      );

      return successResponse(
        res,
        session,
        "Screening session retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE SESSION (ADMIN ONLY)
   */
  static async deleteSession(
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

      await ScreeningSessionService.deleteSession(id, actor, req.ip);

      return successResponse(
        res,
        null,
        "Screening session deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}
