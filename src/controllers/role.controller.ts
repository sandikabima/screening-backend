import { NextFunction, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { RoleService } from "@/services/role.service";
import { CreateRoleInput, GetRoleInput, UpdateRoleInput } from "@/types/role";
import { successResponse } from "@/utils/response";

export class RoleController {
  static async getRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetRoleInput;
      const { roles, pagination } = await RoleService.getRole(queryFilters);

      return successResponse(
        res,
        roles,
        "Role list retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getRoleById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const role = await RoleService.getRoleById(id);
      return successResponse(res, role, "Role retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  static async createRole(
    req: AuthenticatedRequest<any, any, CreateRoleInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      // PASSING ACTOR DAN IP ADDRESS KE SERVICE
      const role = await RoleService.createRole(payload, actor, req.ip);
      return successResponse(res, role, "Role created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(
    req: AuthenticatedRequest<{ id: string }, any, UpdateRoleInput>,
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

      // PASSING ACTOR DAN IP ADDRESS KE SERVICE
      const role = await RoleService.updateRole(id, payload, actor, req.ip);
      return successResponse(res, role, "Role updated successfully");
    } catch (error) {
      next(error);
    }
  }

  static async deleteRole(
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

      // PASSING ACTOR DAN IP ADDRESS KE SERVICE
      await RoleService.deleteRole(id, actor, req.ip);
      return successResponse(res, null, "Role deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
