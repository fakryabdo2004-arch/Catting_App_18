import type { Request, Response } from "express";
import * as userRepo from "../../DB/repository/user.repository";
import * as postRepo from "../../DB/repository/post.repository";
import * as commentRepo from "../../DB/repository/comment.repository";

export async function dashboard(req: Request, res: Response) {
  const results = await Promise.allSettled([
    userRepo.count({} as any) as any,
    postRepo.count({} as any) as any,
    commentRepo ? (commentRepo as any).count?.({}) : Promise.resolve(0)
  ]);
  const [users, posts, comments] = results.map(r => r.status === "fulfilled" ? r.value : null);
  res.json({ users, posts, comments, errors: results.filter(r=>r.status==="rejected") });
}

export async function changeRole(req: Request, res: Response) {
  try {
    const { role } = req.body;
    const userId = req.params.userId;
    const result = await (userRepo as any).updateOne({ _id: userId }, { $set: { role } });
    res.json({ updated: result?.modifiedCount ?? 0 });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Failed to change role" });
  }
}
