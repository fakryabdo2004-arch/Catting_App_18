
import { Types } from "mongoose";
import { Request, Response } from "express";
import { PostModel } from "../../DB/model/post.model";
import { PostRepository } from "../../DB/repository/post.repository";
import { SuccessResponse } from "../../utils/response/success.response";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";

export class PostService {
  private postRepo = new PostRepository(PostModel);

  async createPost(req: Request, res: Response) {
    const ownerId = (req as any).user?._id;
    if (!ownerId) throw new BadRequestException("Unauthenticated");

    const post = await this.postRepo.createPost({
      data: [{ owner: new Types.ObjectId(ownerId), body: req.body.body, media: (req.body.media || []).map((id:string)=>new Types.ObjectId(id)) }],
      options: { lean:false }
    });
    return new SuccessResponse(res, { message: "Post created", data: post });
  }

  async like(req: Request, res: Response) {
    const ownerId = (req as any).user?._id;
    const postId = new Types.ObjectId(req.body.postId);
    const result = await this.postRepo.like({ postId, userId: new Types.ObjectId(ownerId) });
    if (!result.matchedCount) throw new NotFoundException("Already liked or post not found");
    return new SuccessResponse(res, { message: "Liked" });
  }

  async unlike(req: Request, res: Response) {
    const ownerId = (req as any).user?._id;
    const postId = new Types.ObjectId(req.body.postId);
    const result = await this.postRepo.unlike({ postId, userId: new Types.ObjectId(ownerId) });
    if (!result.matchedCount) throw new NotFoundException("Not liked or post not found");
    return new SuccessResponse(res, { message: "Unliked" });
  }
}
