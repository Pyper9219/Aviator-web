import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWithdrawalDoc extends Document {
  userId: string;
  username: string;
  method: "MPESA" | "AIRTEL" | "BANK";
  accountNumber: string;
  accountName?: string;
  amountKSH: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawalDoc>(
  {
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    method: { type: String, enum: ["MPESA", "AIRTEL", "BANK"], required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String },
    amountKSH: { type: Number, required: true, min: 200 },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    adminNote: { type: String },
    approvedAt: { type: Date },
    rejectedAt: { type: Date }
  },
  { timestamps: true }
);

export const Withdrawal: Model<IWithdrawalDoc> = mongoose.models.Withdrawal || mongoose.model<IWithdrawalDoc>("Withdrawal", WithdrawalSchema);
