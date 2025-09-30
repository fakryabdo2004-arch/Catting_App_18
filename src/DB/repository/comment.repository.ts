import { Types } from "mongoose";
import Comment from "../model/comment.model";

export async function create(doc: any) {
  return await Comment.create(doc);
}

export async function findByPost(postId: string) {
  return await Comment.find({ postId: new Types.ObjectId(postId) }).sort({ createdAt: 1 }).lean();
}

export async function streamByPost(postId: string) {
  
  const cursor = Comment.find({ postId: new Types.ObjectId(postId) }).cursor();
  for await (const doc of cursor) {
    yield doc;
  }
}

export async function reply(parentId: string, authorId: string, content: string) {
  const parent = await Comment.findById(parentId);
  if (!parent) return null;
  const reply = await Comment.create({
    postId: parent.postId,
    authorId: new Types.ObjectId(authorId),
    content,
    parentId: parent._id
  });
  await Comment.updateOne({ _id: parent._id }, { $inc: { repliesCount: 1 } });
  return reply;
}
