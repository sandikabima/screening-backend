import { Response, NextFunction } from "express";

import { GetSessionInput } from "@/types/session.types";
import { successResponse } from "@/utils/response";
import { AuthenticatedRequest } from "@/middleware/auth";
import { SessionService } from "@/services/session.service";

export class SessionController {
  static async getSessions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const queryFilters = req.query as unknown as GetSessionInput;

      const { sessions, pagination } =
        await SessionService.getSessions(queryFilters);

      successResponse(
        res,
        sessions,
        "Daftar sesi pengguna berhasil diambil",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  static async revokeSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;

      await SessionService.revokeSession(id);

      successResponse(res, null, "Akses sesi berhasil diputus", 200);
    } catch (error) {
      next(error);
    }
  }

  static async revokeOtherSessions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId: string = req.user?.userId || "";
      const currentRefreshToken: string | undefined = req.cookies?.refreshToken;

      await SessionService.revokeOtherSessions(userId, currentRefreshToken);

      successResponse(res, null, "Sesi perangkat lain berhasil di-logout", 200);
    } catch (error) {
      next(error);
    }
  }
}
