import { UserController } from "@/controllers/user.controller";
import { authenticate, authorizePermission } from "@/middleware/auth";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middleware/validation";
import {
  getUserIdSchema,
  getUsersQuerySchema,
  registerSchema,
  updateStatusSchema,
  updateUserSchema,
} from "@/types/auth";
import { asyncHandler } from "@/utils/async-handler";
import { Router } from "express";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  authorizePermission("SYSTEM_SETTING"),
  validateQuery(getUsersQuerySchema),
  asyncHandler(UserController.getUsers),
);
router.get(
  "/:id",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getUserIdSchema),
  asyncHandler(UserController.getuserById),
);
router.post(
  "/",
  authorizePermission("SYSTEM_SETTING"),
  validateBody(registerSchema),
  asyncHandler(UserController.createUsers),
);
router.put(
  "/:id",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getUserIdSchema),
  validateBody(updateUserSchema),
  asyncHandler(UserController.updateUser),
);
router.patch(
  "/:id/status",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getUserIdSchema),
  validateBody(updateStatusSchema),
  asyncHandler(UserController.updateStatus),
);
router.delete(
  "/:id",
  authorizePermission("SYSTEM_SETTING"),
  validateParams(getUserIdSchema),
  asyncHandler(UserController.deleteUser),
);

export default router;
