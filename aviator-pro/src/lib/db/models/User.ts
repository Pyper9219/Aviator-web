import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDoc extends Document {
  username: string;
  phoneOrEmail: string;
  passwordHash: string;
  balanceUSD: number;
  bonusBalanceUSD: number;
  vipLevel: number;
}

const UserSchema = new Schema<IUserDoc>(
  {
    username: { type: String, required: true, unique: true },
    phoneOrEmail: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    balanceUSD: { type: Number, default: 250.00, min: 0 },
    bonusBalanceUSD: { type: Number, default: 50.00, min: 0 },
    vipLevel: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const User: Model<IUserDoc> = mongoose.models.User || mongoose.model<IUserDoc>("User", UserSchema);
