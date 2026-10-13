export function formatKESBalance(
  balanceUSD: number,
  kesPerUsd: number | null | undefined
): string | null {
  if (
    !Number.isFinite(balanceUSD) ||
    typeof kesPerUsd !== "number" ||
    !Number.isFinite(kesPerUsd) ||
    kesPerUsd <= 0
  ) {
    return null;
  }

  return `KSh ${(balanceUSD * kesPerUsd).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
