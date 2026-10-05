import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransactionDoc extends Document {
  userId: string;
  reference: string;
  method: "MPESA" | "AIRTEL" | "PAYSTACK_CARD";
  phone?: string;
  amountLocal: number;
  amountUSD: number;
  currency: string;
  status: "pending" | "completed" | "failed";
}

const TransactionSchema = new Schema<ITransactionDoc>(
  {
    userId: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    method: { type: String, required: true },
    phone: { type: String },
    amountLocal: { type: Number, required: true },
    amountUSD: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" }
  },
  { timestamps: true }
);

export const Transaction: Model<ITransactionDoc> = mongoose.models.Transaction || mongoose.model<ITransactionDoc>("Transaction", TransactionSchema);
