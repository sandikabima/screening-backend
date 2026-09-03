import { AuthenticatedRequest } from "@/middleware/auth";
import { AuthService } from "@/services/auth.service";
import { LoginInput, RefreshInput } from "@/types/auth";
import { successResponse } from "@/utils/response";
import { NextFunction, Request, Response } from "express";

export class AuthController {
  static async login(
    req: Request<any, any, LoginInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { email, password } = req.body;
      const deviceInfo = req.headers["user-agent"] || "Unknown Device";
      const result = await AuthService.login({ email, password }, deviceInfo);
      return successResponse(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: Request<any, any, RefreshInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      return successResponse(res, null, "Logout successful");
    } catch (error) {
      next(error);
    }
  }

  static async refresh(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { refreshToken } = req.body as RefreshInput;
      const result = await AuthService.refresh(refreshToken);
      return successResponse(res, result, "Token refreshed successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getMe(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await AuthService.getMe(req.user?.userId);
      return successResponse(res, result, "Profile fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}
