import { NextFunction, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { PermissionService } from "@/services/permission.service";
import { UserActor } from "@/services/user.service";
import {
  AssignPermissionsInput,
  CreatePermissionInput,
  PermissionQueryInput,
  UpdatePermissionInput,
} from "@/types/permission";
import { successResponse } from "@/utils/response";

export class PermissionController {
  static async listPermissions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as PermissionQueryInput;
      const { permissions, pagination } =
        await PermissionService.listPermissions(queryFilters);

      return successResponse(
        res,
        permissions,
        "Permissions retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getPermissionById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const permission = await PermissionService.getPermissionById(id);
      return successResponse(
        res,
        permission,
        "Permission retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  static async createPermission(
    req: AuthenticatedRequest<any, any, CreatePermissionInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body;
      const actor: UserActor = {
        userId: req.user?.userId || "SYSTEM",
        email: req.user?.email || "system@internal",
      };

      const permission = await PermissionService.createPermission(
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        permission,
        "Permission created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  static async updatePermission(
    req: AuthenticatedRequest<{ id: string }, any, UpdatePermissionInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const actor: UserActor = {
        userId: req.user?.userId || "SYSTEM",
        email: req.user?.email || "system@internal",
      };

      const permission = await PermissionService.updatePermission(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        permission,
        "Permission updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  static async deletePermission(
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

      await PermissionService.deletePermission(id, actor, req.ip);

      return successResponse(res, null, "Permission deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  static async getRolePermissions(
    req: AuthReqWithParams<{ roleId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { roleId } = req.params;
      const permissions = await PermissionService.getRolePermissions(roleId);
      return successResponse(
        res,
        permissions,
        "Role permissions retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  static async assignPermissions(
    req: AuthenticatedRequest<any, any, AssignPermissionsInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body;
      const actor: UserActor = {
        userId: req.user?.userId || "SYSTEM",
        email: req.user?.email || "system@internal",
      };

      const rolePermission = await PermissionService.assign(
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        rolePermission,
        "Role permissions updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}
