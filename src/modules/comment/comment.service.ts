import type { Request, Response } from "express";
import * as repo from "../../DB/repository/comment.repository";

export async function create(req: Request, res: Response) {
  try {
    const postId = req.params.postId || req.body.postId;
    const authorId = (req as any).user?._id || req.body.authorId;
    const content = req.body.content;
    if (!postId || !authorId || !content) return res.status(400).json({ message: "Missing fields" });
    const doc = await repo.create({ postId, authorId, content });
    res.status(201).json(doc);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to create comment" });
  }
}

export async function reply(req: Request, res: Response) {
  try {
    const parentId = req.params.parentId || req.body.parentId;
    const authorId = (req as any).user?._id || req.body.authorId;
    const content = req.body.content;
    const doc = await repo.reply(parentId, authorId, content);
    if (!doc) return res.status(404).json({ message: "Parent comment not found" });
    res.status(201).json(doc);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to reply" });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const postId = req.params.postId;
    const docs = await repo.findByPost(postId);
    res.json(docs);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to list comments" });
  }
}
