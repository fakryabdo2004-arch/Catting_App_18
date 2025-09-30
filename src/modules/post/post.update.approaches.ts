
import { Router } from "express";
import type { Request, Response } from "express";
import * as repo from "../../DB/repository/post.repository";
import { Types } from "mongoose";

const router = Router();

router.patch("/post/:postId/inmemory", async (req: Request, res: Response) => {
  try {
    const post = await repo.findById(req.params.postId as string);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const body = req.body || {};
    Object.assign(post, body, { updatedAt: new Date() });
    const saved = await repo.save(post);
    return res.json({ approach: "in-memory", post: saved });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed" });
  }
});


router.patch("/post/:postId/two-requests", async (req: Request, res: Response) => {
  try {
    const post = await repo.findById(req.params.postId as string);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const result = await repo.updateOne({ _id: new Types.ObjectId(req.params.postId) }, { $set: { ...req.body, updatedAt: new Date() } });
    return res.json({ approach: "two-db-requests", matched: result.matchedCount, modified: result.modifiedCount });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed" });
  }
});


router.patch("/post/:postId/agg-pipeline", async (req: Request, res: Response) => {
  try {
   
    const updates = Array.isArray(req.body) ? req.body : [{ $set: { ...req.body } }];
    const result = await repo.updateWithPipeline(req.params.postId, updates);
    return res.json({ approach: "update-aggregation-pipeline", result });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed" });
  }
});

export default router;
