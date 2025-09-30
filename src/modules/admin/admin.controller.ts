import { Router } from "express";
import type { Request, Response } from "express";
import * as service from "./admin.service";

const router = Router();

router.get("/admin/dashboard", (req: Request, res: Response) => service.dashboard(req, res));
router.patch("/admin/user/:userId/role", (req: Request, res: Response) => service.changeRole(req, res));

export default router;
