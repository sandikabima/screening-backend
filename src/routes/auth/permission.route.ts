import { Router } from "express";
import { PermissionController } from "@/controllers/permission.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  assignPermissionsSchema,
  createPermissionSchema,
  getPermissionIdSchema,
  getRolePermissionParamsSchema,
  permissionQuerySchema,
  updatePermissionSchema,
} from "@/types/permission";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorizePermission("SYSTEM_SETTING"),
  validateQuery(permissionQuerySchema),
  asyncHandler(PermissionController.listPermissions),
);

router.get(
  "/role/:roleId",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getRolePermissionParamsSchema),
  asyncHandler(PermissionController.getRolePermissions),
);

router.post(
  "/assign",
  authorizePermission("SYSTEM_SETTING"),
  validateBody(assignPermissionsSchema),
  asyncHandler(PermissionController.assignPermissions),
);

router.post(
  "/",
  authorizePermission("SYSTEM_SETTING"),
  validateBody(createPermissionSchema),
  asyncHandler(PermissionController.createPermission),
);

router.get(
  "/:id",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getPermissionIdSchema),
  asyncHandler(PermissionController.getPermissionById),
);

router.put(
  "/:id",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getPermissionIdSchema),
  validateBody(updatePermissionSchema),
  asyncHandler(PermissionController.updatePermission),
);

router.delete(
  "/:id",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getPermissionIdSchema),
  asyncHandler(PermissionController.deletePermission),
);

export default router;
