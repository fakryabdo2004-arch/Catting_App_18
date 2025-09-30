
import { Types, UpdateWriteOpResult, Model } from "mongoose";
import { DatabaseRepository } from "./database.repository";
import { IPost } from "../model/post.model";

export class PostRepository extends DatabaseRepository<IPost> {
  constructor(protected override readonly model: Model<IPost>) {
    super(model);
  }

  async createPost({ data, options }:{ data: Partial<IPost>[], options:any }) {
    const created = await this.create({ data, options });
    return created?.[0];
  }

  async like({ postId, userId }:{ postId: Types.ObjectId, userId: Types.ObjectId }): Promise<UpdateWriteOpResult> {
    return this.updateOne({
      filter: { _id: postId, likedBy: { $ne: userId } },
      update: { $addToSet: { likedBy: userId }, $inc: { likesCount: 1 } }
    });
  }

  async unlike({ postId, userId }:{ postId: Types.ObjectId, userId: Types.ObjectId }): Promise<UpdateWriteOpResult> {
    return this.updateOne({
      filter: { _id: postId, likedBy: userId },
      update: { $pull: { likedBy: userId }, $inc: { likesCount: -1 } }
    });
  }
}
