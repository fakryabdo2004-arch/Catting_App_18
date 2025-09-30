
import { Router } from "express";
import type { Request, Response } from "express";
import * as postRepo from "../../DB/repository/post.repository";
import * as commentRepo from "../../DB/repository/comment.repository";

const router = Router();


router.get("/post/:postId/with-comments/inmemory", async (req: Request, res: Response) => {
  const postId = req.params.postId;
  const post = await postRepo.findById(postId);
  if (!post) return res.status(404).json({ message: "Post not found" });
  const comments = await commentRepo.findByPost(postId);
  return res.json({ post, comments, mode: "in-memory" });
});


router.get("/post/:postId/with-comments/stream", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/x-ndjson");
  const postId = req.params.postId;
  const post = await postRepo.findById(postId);
  if (!post) { res.status(404).end(JSON.stringify({ error: "Post not found" })+"\n"); return; }
  res.write(JSON.stringify({ type: "post", data: post }) + "\n");
  for await (const c of commentRepo.streamByPost(postId)) {
    res.write(JSON.stringify({ type: "comment", data: c }) + "\n");
  }
  res.end();
});

export default router;
