import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMpesaDepositDoc extends Document {
  userId: string;
  username: string;
  phoneNumber: string;
  amountKSH: number;
  merchantRequestId: string;
  checkoutRequestId: string;
  mpesaReceiptNumber?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  resultDesc?: string;
  createdAt: Date;
  completedAt?: Date;
}

const MpesaDepositSchema = new Schema<IMpesaDepositDoc>(
  {
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    amountKSH: { type: Number, required: true },
    merchantRequestId: { type: String, required: true },
    checkoutRequestId: { type: String, required: true, unique: true, index: true },
    mpesaReceiptNumber: { type: String },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING", index: true },
    resultDesc: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const MpesaDeposit: Model<IMpesaDepositDoc> = mongoose.models.MpesaDeposit || mongoose.model<IMpesaDepositDoc>("MpesaDeposit", MpesaDepositSchema);
