export interface IUser {
  _id: string;
  username: string;
  email: string;
  balanceUSD: number;
  bonusBalanceUSD: number;
  vipLevel: number;
}

export interface IBetSlot {
  stake: number;
  autoCashout: boolean;
  autoMultiplier: number;
  isLocked: boolean;
  betId: string | null;
  hasCashedOut: boolean;
  cashedOutMultiplier: number | null;
  winAmount: number | null;
}

export type GamePhase = 'PREPARING' | 'IN_FLIGHT' | 'CRASHED';

export interface GameState {
  roundNumber: number;
  phase: GamePhase;
  multiplier: number;
  elapsedSec: number;
  crashMultiplier: number;
  history: number[];
  seeds: {
    hash: string;
  };
}
