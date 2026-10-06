import mongoose, { Document, Model, Schema } from "mongoose";

export type GameRoundPhase = "PREPARING" | "IN_FLIGHT" | "CRASHED";

export interface IGameRoundDoc extends Document<string> {
  roundNumber: number;
  phase: GameRoundPhase;
  startsAt: Date;
  startedAt?: Date;
  crashAt?: Date;
  crashMultiplier: number;
  serverSeed: string;
  seedHash: string;
}

const GameRoundSchema = new Schema<IGameRoundDoc>(
  {
    _id: { type: String, default: "current" },
    roundNumber: { type: Number, required: true },
    phase: { type: String, enum: ["PREPARING", "IN_FLIGHT", "CRASHED"], required: true, index: true },
    startsAt: { type: Date, required: true },
    startedAt: { type: Date },
    crashAt: { type: Date },
    crashMultiplier: { type: Number, required: true, min: 1.01 },
    serverSeed: { type: String, required: true },
    seedHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const GameRound: Model<IGameRoundDoc> =
  mongoose.models.GameRound || mongoose.model<IGameRoundDoc>("GameRound", GameRoundSchema);
