import mongoose, { Document, Model, Schema } from "mongoose";
import type { WithdrawalCurrency, WithdrawalMethod } from "@/lib/withdrawals";

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IWithdrawalDoc extends Document {
  userId: string;
  username: string;
  contact: string;
  amountUSD: number;
  currency: WithdrawalCurrency;
  exchangeRate: number;
  amountLocal: number;
  method: WithdrawalMethod;
  recipientName: string;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
  status: WithdrawalStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  paidAt?: Date;
  paidBy?: string;
}

const WithdrawalSchema = new Schema<IWithdrawalDoc>(
  {
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    contact: { type: String, required: true },
    amountUSD: { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: ["KES", "UGX"], required: true },
    exchangeRate: { type: Number, required: true, min: 0.000001 },
    amountLocal: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ["MPESA", "AIRTEL", "BANK_WIRE"], required: true },
    recipientName: { type: String, required: true },
    phone: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    paidAt: { type: Date },
    paidBy: { type: String }
  },
  { timestamps: true }
);

WithdrawalSchema.index({ status: 1, createdAt: -1 });

export const Withdrawal: Model<IWithdrawalDoc> =
  mongoose.models.Withdrawal || mongoose.model<IWithdrawalDoc>("Withdrawal", WithdrawalSchema);
