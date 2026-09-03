import { Router } from "express";
import { RoleController } from "@/controllers/role.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  createRoleSchema,
  getRoleIdSchema,
  getRoleQuerySchema,
  updateRoleSchema,
} from "@/types/role";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  authorizePermission("SYSTEM_SETTING"),
  validateQuery(getRoleQuerySchema),
  asyncHandler(RoleController.getRole),
);

router.get(
  "/:id",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getRoleIdSchema),
  asyncHandler(RoleController.getRoleById),
);

router.post(
  "/",
  authorizePermission("SYSTEM_SETTING"),
  validateBody(createRoleSchema),
  asyncHandler(RoleController.createRole),
);

router.put(
  "/:id",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getRoleIdSchema),
  validateBody(updateRoleSchema),
  asyncHandler(RoleController.updateRole),
);

router.delete(
  "/:id",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getRoleIdSchema),
  asyncHandler(RoleController.deleteRole),
);

export default router;
