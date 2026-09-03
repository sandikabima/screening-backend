import { Router } from "express";

import { authenticate, authorizePermission } from "@/middleware/auth";
import { SessionController } from "@/controllers/session.controller";

const router: Router = Router();

router.use(authenticate);
router.use(authorizePermission("SYSTEM_SETTING"));

router.get("/", SessionController.getSessions);
router.delete("/revoke-others", SessionController.revokeOtherSessions);
router.delete("/:id", SessionController.revokeSession);

export default router;
