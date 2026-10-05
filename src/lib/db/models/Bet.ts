import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBetDoc extends Document {
  roundNumber: number;
  userId: string;
  username: string;
  consoleSlot: 1 | 2;
  stakeAmount: number;
  autoCashoutMultiplier?: number;
  cashedOut: boolean;
  cashedOutMultiplier?: number;
  payoutAmount: number;
  status: "ACTIVE" | "CASHED_OUT" | "LOST";
  createdAt: Date;
}

const BetSchema = new Schema<IBetDoc>(
  {
    roundNumber: { type: Number, required: true, index: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    consoleSlot: { type: Number, enum: [1, 2], required: true },
    stakeAmount: { type: Number, required: true, min: 0.1 },
    autoCashoutMultiplier: { type: Number },
    cashedOut: { type: Boolean, default: false },
    cashedOutMultiplier: { type: Number },
    payoutAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "CASHED_OUT", "LOST"], default: "ACTIVE" }
  },
  { timestamps: true }
);

export const Bet: Model<IBetDoc> = mongoose.models.Bet || mongoose.model<IBetDoc>("Bet", BetSchema);
