
import { Schema, Types, model, models, HydratedDocument } from "mongoose";

export interface IPost {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  body: string;
  media?: Types.ObjectId[]; 
  likesCount: number;
  likedBy: Types.ObjectId[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>({
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  body: { type: String, required: true, trim: true, minlength: 1, maxlength: 280 },
  media: [{ type: Schema.Types.ObjectId, ref: "Asset" }],
  likesCount: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: Date,
},{ timestamps: true });


postSchema.pre("validate", function(next){
  if (this.isModified("body") && typeof this.body === "string") {
    this.body = this.body.trim();
  }
  next();
});

postSchema.pre("save", function(next){
  
  if (!this.body || this.body.length === 0) {
    return next(new Error("Post body cannot be empty"));
  }
  next();
});


postSchema.pre(/^find/, function(next){

  if (!(this as any)._skipParanoid) {
    this.where({ isDeleted: { $ne: true }});
  }
  next();
});


postSchema.pre("findOne", function(next){

  const q = this.getQuery();
  this.setQuery({ ...q, isDeleted: { $ne: true }});
  next();
});

postSchema.pre(["findOneAndUpdate","findByIdAndUpdate"], function(next){
  const u = this.getUpdate() || {};
 
  this.setUpdate({ $set: { updatedAt: new Date() }, ...u });
  next();
});


postSchema.pre("deleteOne", { document: false, query: true }, function(next){

  this.setUpdate({ $set: { isDeleted: true, deletedAt: new Date() }});
  next();
});


postSchema.pre("insertMany", function(next, docs: HydratedDocument<IPost>[]){
  for (const d of docs) {
    if (typeof d.body === "string") d.body = d.body.trim();
  }
  next();
});

export const PostModel = models.Post || model<IPost>("Post", postSchema);
export type HPostDocument = HydratedDocument<IPost>;
