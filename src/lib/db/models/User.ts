import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDoc extends Document {
  username: string;
  phoneOrEmail: string;
  passwordHash: string;
  balanceKSH: number;
  lockedWithdrawalKSH: number;
  role: "PILOT" | "ADMIN";
  vipLevel: number;
}

const UserSchema = new Schema<IUserDoc>(
  {
    username: { type: String, required: true, unique: true },
    phoneOrEmail: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    balanceKSH: { type: Number, default: 2500.00, min: 0 },
    lockedWithdrawalKSH: { type: Number, default: 0.00, min: 0 },
    role: { type: String, enum: ["PILOT", "ADMIN"], default: "PILOT" },
    vipLevel: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const User: Model<IUserDoc> = mongoose.models.User || mongoose.model<IUserDoc>("User", UserSchema);
