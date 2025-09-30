
import { Schema, Types, model, models, HydratedDocument } from "mongoose";
export interface ITwoFA {
  userId: Types.ObjectId;
  otp: number;
  expiresAt: Date;
  loginSession?: string;
  type: "enable" | "login" | "emailChange";
  newEmail?: string;
}
const schema = new Schema<ITwoFA>({
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true, unique: false, required: true },
  otp: { type: Number, required: true },
  expiresAt: { type: Date, required: true, index: 1 },
  loginSession: { type: String },
  type: { type: String, enum: ["enable","login","emailChange"], required: true },
  newEmail: { type: String }
}, { timestamps: true });
schema.index({ userId: 1, type: 1 });
export const TwoFAModel = models.TwoFA || model<ITwoFA>("TwoFA", schema);
export type HTwoFADoc = HydratedDocument<ITwoFA>;
