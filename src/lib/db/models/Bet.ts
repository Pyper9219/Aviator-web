import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBetModel extends Document {
  roundNumber: number;
  userId: mongoose.Types.ObjectId | string;
  username: string;
  consoleSlot: 1 | 2;
  stakeAmount: number;
  autoCashoutMultiplier?: number;
  cashedOut: boolean;
  cashedOutMultiplier?: number;
  payoutAmount: number;
  status: 'ACTIVE' | 'CASHED_OUT' | 'LOST';
}

const BetSchema = new Schema<IBetModel>(
  {
    roundNumber: { type: Number, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    consoleSlot: { type: Number, enum: [1, 2], required: true },
    stakeAmount: { type: Number, required: true, min: 1 },
    autoCashoutMultiplier: { type: Number },
    cashedOut: { type: Boolean, default: false },
    cashedOutMultiplier: { type: Number },
    payoutAmount: { type: Number, default: 0.00 },
    status: { type: String, enum: ['ACTIVE', 'CASHED_OUT', 'LOST'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Bet: Model<IBetModel> = mongoose.models.Bet || mongoose.model<IBetModel>('Bet', BetSchema);
