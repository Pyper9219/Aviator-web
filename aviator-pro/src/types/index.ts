export interface IUser {
  _id: string;
  username: string;
  phoneOrEmail: string;
  balanceUSD: number;
  bonusBalanceUSD: number;
  vipLevel: number;
}

export type GamePhase = "PREPARING" | "IN_FLIGHT" | "CRASHED";

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
