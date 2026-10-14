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

export interface IOrbiterPlayer {
  id: string;
  username: string;
  stake: number;
  mult: number | null;
  profit: number;
  status: "IN_FLIGHT" | "CASHED_OUT" | "CRASHED";
  timestamp: number;
}
