import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserModel extends Document {
  username: string;
  email: string;
  balanceUSD: number;
  bonusBalanceUSD: number;
  vipLevel: number;
}

const UserSchema = new Schema<IUserModel>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    balanceUSD: { type: Number, required: true, default: 4850.50, min: 0 },
    bonusBalanceUSD: { type: Number, default: 0.00, min: 0 },
    vipLevel: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const User: Model<IUserModel> = mongoose.models.User || mongoose.model<IUserModel>('User', UserSchema);
