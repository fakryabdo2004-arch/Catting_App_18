import { Schema, Types, model } from "mongoose";

const commentSchema = new Schema(
  {
    postId: { type: Types.ObjectId, ref: "Post", index: true, required: true },
    authorId: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    parentId: { type: Types.ObjectId, ref: "Comment", default: null },
    repliesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentId",
  justOne: false,
});

export default model("Comment", commentSchema);
