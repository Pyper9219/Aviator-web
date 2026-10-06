export type WithdrawalCurrency = "KES" | "UGX";
export type WithdrawalMethod = "MPESA" | "AIRTEL" | "BANK_WIRE";

export interface WithdrawalRates {
  KES: number | null;
  UGX: number | null;
}

export function getWithdrawalRates(): WithdrawalRates {
  const parseRate = (value: string | undefined): number | null => {
    if (!value) return null;
    const rate = Number(value);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  };

  return {
    KES: parseRate(process.env.WITHDRAWAL_KES_PER_USD),
    UGX: parseRate(process.env.WITHDRAWAL_UGX_PER_USD)
  };
}

export function isWithdrawalMethod(value: unknown): value is WithdrawalMethod {
  return value === "MPESA" || value === "AIRTEL" || value === "BANK_WIRE";
}

export function isWithdrawalCurrency(value: unknown): value is WithdrawalCurrency {
  return value === "KES" || value === "UGX";
}

export class WithdrawalError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "WithdrawalError";
  }
}
