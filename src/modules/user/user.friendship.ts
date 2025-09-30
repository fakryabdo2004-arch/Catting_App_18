import { Router } from "express";
import type { Request, Response } from "express";
import * as userRepo from "../../DB/repository/user.repository";

const router = Router();

router.post("/user/:userId/friend-request/:targetId", async (req: Request, res: Response) => {
  try {
    const { userId, targetId } = req.params;
    const result = await (userRepo as any).sendFriendRequest?.(userId, targetId);
    res.json({ ok: true, result });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to send friend request" });
  }
});

router.post("/user/:userId/friend-accept/:requestId", async (req: Request, res: Response) => {
  try {
    const { userId, requestId } = req.params;
    const result = await (userRepo as any).acceptFriendRequest?.(userId, requestId);
    res.json({ ok: true, result });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to accept friend request" });
  }
});

export default router;
