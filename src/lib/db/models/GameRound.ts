import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGameRoundModel extends Document {
  roundNumber: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  sha256Hash: string;
  crashMultiplier: number;
  status: 'PREPARING' | 'IN_FLIGHT' | 'CRASHED';
}

const GameRoundSchema = new Schema<IGameRoundModel>(
  {
    roundNumber: { type: Number, required: true, unique: true, index: true },
    serverSeed: { type: String, required: true },
    clientSeed: { type: String, required: true },
    nonce: { type: Number, required: true },
    sha256Hash: { type: String, required: true },
    crashMultiplier: { type: Number, required: true },
    status: { type: String, enum: ['PREPARING', 'IN_FLIGHT', 'CRASHED'], default: 'PREPARING' },
  },
  { timestamps: true }
);

export const GameRound: Model<IGameRoundModel> = mongoose.models.GameRound || mongoose.model<IGameRoundModel>('GameRound', GameRoundSchema);
