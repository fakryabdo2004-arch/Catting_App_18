import { Schema, Types, model } from "mongoose";

export enum AssetVisibility { PUBLIC = "public", PRIVATE = "private" }

export interface HAssetDocument {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  key: string;
  bucket: string;
  mime: string;
  size: number;
  etag?: string;
  visibility: AssetVisibility;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  type?: "profile" | "cover" | "generic";
}

const schema = new Schema<HAssetDocument>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    key: { type: String, required: true, unique: true },
    bucket: { type: String, required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    etag: String,
    visibility: { type: String, enum: Object.values(AssetVisibility), default: AssetVisibility.PRIVATE },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    tags: [String],
    type: { type: String, enum: ["profile","cover","generic"], default: "generic" },
  },
  { timestamps: true }
);

export const AssetModel = model<HAssetDocument>("Asset", schema);
