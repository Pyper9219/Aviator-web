import mongoose, { Document, Model, Schema } from "mongoose";

export type BetStatus = "ACTIVE" | "CASHED_OUT" | "LOST";

export interface IBetDoc extends Document {
  roundNumber: number;
  userId: string;
  username: string;
  consoleSlot: 1 | 2;
  stakeAmount: number;
  status: BetStatus;
  cashedOutMultiplier?: number;
  payoutAmount: number;
  createdAt: Date;
}

const BetSchema = new Schema<IBetDoc>(
  {
    roundNumber: { type: Number, required: true, index: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    consoleSlot: { type: Number, enum: [1, 2], required: true },
    stakeAmount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ["ACTIVE", "CASHED_OUT", "LOST"], default: "ACTIVE", index: true },
    cashedOutMultiplier: { type: Number },
    payoutAmount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

BetSchema.index({ createdAt: -1 });
BetSchema.index({ roundNumber: 1, userId: 1, consoleSlot: 1 }, { unique: true });

export const Bet: Model<IBetDoc> = mongoose.models.Bet || mongoose.model<IBetDoc>("Bet", BetSchema);
