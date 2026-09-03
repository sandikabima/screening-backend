import { NextFunction, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import {
  GetUsersInput,
  RegisterInput,
  UpdateStatusInput,
  UpdateUserInput,
} from "@/types/auth";
import { UserActor, UserService } from "@/services/user.service";
import { successResponse } from "@/utils/response";

export class UserController {
  static async getUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetUsersInput;
      const { users, pagination } = await UserService.getUsers(queryFilters);

      return successResponse(
        res,
        users,
        "User list retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getuserById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const user = await UserService.getById(id);

      return successResponse(res, user, "User retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async createUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const input = req.body as RegisterInput;
      const actor: UserActor = {
        userId: req.user?.userId || "SYSTEM",
        email: req.user?.email || "system@internal",
      };

      const result = await UserService.createUsers(input, actor, req.ip);

      return successResponse(res, result, "User created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(
    req: AuthenticatedRequest<{ id: string }, any, UpdateUserInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const actor: UserActor = {
        userId: req.user?.userId || "SYSTEM",
        email: req.user?.email || "system@internal",
      };

      const updatedUser = await UserService.update(
        id,
        updateData,
        actor,
        req.ip,
      );

      return successResponse(res, updatedUser, "User updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(
    req: AuthenticatedRequest<{ id: string }, any, UpdateStatusInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const actor: UserActor = {
        userId: req.user?.userId || "SYSTEM",
        email: req.user?.email || "system@internal",
      };

      const updatedStatus = await UserService.changeStatus(
        id,
        isActive,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        updatedStatus,
        "User status updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const actor: UserActor = {
        userId: req.user?.userId || "SYSTEM",
        email: req.user?.email || "system@internal",
      };

      await UserService.delete(id, actor, req.ip);

      return successResponse(res, null, "User deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
