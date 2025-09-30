
import { Router } from "express";
import type { Request, Response } from "express";
import PostModel from "../../DB/model/post.model";
import "../../DB/model/comment.model";

const router = Router();

router.get("/post/:postId/with-comments/populate", async (req: Request, res: Response) => {
  const post = await (PostModel as any).findById(req.params.postId).populate({ path: "comments", justOne: false });
  if (!post) return res.status(404).json({ message: "Post not found" });
  return res.json(post);
});

export default router;
