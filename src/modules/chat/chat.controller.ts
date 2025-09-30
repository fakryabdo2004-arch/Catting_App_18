import { Router } from "express";
import type { Request, Response } from "express";
import * as userRepo from "../../DB/repository/user.repository";

const router = Router();


router.get("/chat/users", async (req: Request, res: Response) => {
  try {
    const users = await (userRepo as any).listChatUsers?.();
    res.json(users || []);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to list users" });
  }
});

export default router;
