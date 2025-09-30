
import { Router } from "express";
import * as repo from "../../DB/repository/post.repository";
import type { Request, Response } from "express";

const router = Router();


router.get("/posts", async (req: Request, res: Response) => {
  try {
    const available = req.query.available?.toString() === "true" ? true : req.query.available?.toString() === "false" ? false : undefined;
    const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "10", 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (available !== undefined) filter.available = available;

    const [items, total] = await Promise.all([
      repo.findMany(filter, { skip, limit, sort: { createdAt: -1 } } as any) as any,
      repo.count(filter) as any
    ]);

    return res.json({ page, limit, total, items });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || "Failed to list posts" });
  }
});

export default router;
