import { Router } from "express";
import type { Request, Response } from "express";
import * as service from "./comment.service";

const router = Router({ mergeParams: true }); 

router.post("/post/:postId/comment", (req: Request, res: Response) => service.create(req, res));
router.post("/comment/:parentId/reply", (req: Request, res: Response) => service.reply(req, res));
router.get("/post/:postId/comments", (req: Request, res: Response) => service.list(req, res));

export default router;
