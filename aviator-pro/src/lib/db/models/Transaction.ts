import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransactionDoc extends Document {
  userId: string;
  reference: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  method: "MPESA" | "AIRTEL" | "PAYSTACK_CARD";
  phone?: string;
  amountLocal: number;
  amountUSD: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  resultDescription?: string;
  mpesaReceiptNumber?: string;
  callbackResultCode?: number;
  callbackAmount?: number;
  callbackPhone?: string;
}

const TransactionSchema = new Schema<ITransactionDoc>(
  {
    userId: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    checkoutRequestId: { type: String, unique: true, sparse: true },
    merchantRequestId: { type: String },
    method: { type: String, required: true },
    phone: { type: String },
    amountLocal: { type: Number, required: true },
    amountUSD: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    resultDescription: { type: String },
    mpesaReceiptNumber: { type: String },
    callbackResultCode: { type: Number },
    callbackAmount: { type: Number },
    callbackPhone: { type: String }
  },
  { timestamps: true }
);

export const Transaction: Model<ITransactionDoc> = mongoose.models.Transaction || mongoose.model<ITransactionDoc>("Transaction", TransactionSchema);
