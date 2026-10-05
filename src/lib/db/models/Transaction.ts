import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransactionModel extends Document {
  userId: mongoose.Types.ObjectId | string;
  reference: string;
  paystackId?: string;
  amountLocal: number;
  amountUSD: number;
  currency: string;
  channel: string;
  status: 'pending' | 'success' | 'failed';
  boosterApplied: boolean;
}

const TransactionSchema = new Schema<ITransactionModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reference: { type: String, required: true, unique: true, index: true },
    paystackId: { type: String },
    amountLocal: { type: Number, required: true },
    amountUSD: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    channel: { type: String, default: 'card' },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    boosterApplied: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Transaction: Model<ITransactionModel> = mongoose.models.Transaction || mongoose.model<ITransactionModel>('Transaction', TransactionSchema);
