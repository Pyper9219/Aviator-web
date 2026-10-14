"use client";

import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { CheckCircle2, Clock3, Wallet } from "lucide-react";
import { formatKESBalance } from "@/lib/currency";
import { DEFAULT_KES_PER_USD } from "@/lib/withdrawals";

type DepositStatus = "pending" | "completed" | "failed";

interface DepositRecord {
  reference: string;
  status: DepositStatus;
  amountLocal: number;
  amountUSD: number;
  currency: string;
  createdAt: string;
  resultDescription?: string;
  mpesaReceiptNumber?: string;
}

export default function CashierPage() {
  const [balance, setBalance] = useState(0);
  const [kesPerUsd, setKesPerUsd] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [amountKES, setAmountKES] = useState("500");
  const [deposit, setDeposit] = useState<DepositRecord | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const polling = useRef(false);
  const amount = Number(amountKES);
  const formattedBalance = formatKESBalance(balance, kesPerUsd);
  const estimatedCreditUSD =
    kesPerUsd && Number.isSafeInteger(amount) && amount > 0
      ? Math.round((amount / kesPerUsd) * 100) / 100
      : null;

  const loadAccountAndHistory = useCallback(async () => {
    const [accountResponse, historyResponse] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/cashier/deposit", { cache: "no-store" }),
    ]);
    const [accountData, historyData] = await Promise.all([
      accountResponse.json(),
      historyResponse.json(),
    ]);
    if (!accountResponse.ok) throw new Error(accountData.error || "Unable to load account balance");
    if (!historyResponse.ok) throw new Error(historyData.error || "Unable to load deposit history");
    if (accountData.user) setBalance(accountData.user.balanceUSD);
    const rate = accountData.depositKESPerUSD ?? accountData.rates?.KES;
    setKesPerUsd(typeof rate === "number" && Number.isFinite(rate) && rate > 0 ? rate : null);
    setRecentDeposits(historyData.transactions);
  }, []);

  const refreshDeposit = useCallback(async (reference: string) => {
    if (polling.current) return;
    polling.current = true;
    try {
      const response = await fetch(
        `/api/cashier/deposit?reference=${encodeURIComponent(reference)}`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to refresh M-Pesa payment status");
      const updatedDeposit = data.transaction as DepositRecord;
      setDeposit(updatedDeposit);
      setRecentDeposits((current) =>
        current.map((item) => item.reference === updatedDeposit.reference ? updatedDeposit : item)
      );
      if (updatedDeposit.status === "completed") {
        const accountResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const accountData = await accountResponse.json();
        if (!accountResponse.ok) throw new Error(accountData.error || "Unable to refresh account balance");
        if (accountData.user) setBalance(accountData.user.balanceUSD);
        setNotice("M-Pesa payment confirmed. Your wallet has been credited.");
      } else if (updatedDeposit.status === "failed") {
        setError(updatedDeposit.resultDescription || "M-Pesa payment was not completed.");
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh payment status");
    } finally {
      polling.current = false;
    }
  }, []);

  useEffect(() => {
    loadAccountAndHistory()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load cashier"))
      .finally(() => setLoading(false));
  }, [loadAccountAndHistory]);

  useEffect(() => {
    if (deposit?.status !== "pending") return;
    const timer = window.setInterval(() => void refreshDeposit(deposit.reference), 5_000);
    return () => window.clearInterval(timer);
  }, [deposit?.reference, deposit?.status, refreshDeposit]);

  async function requestDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/cashier/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountKES: amount, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start M-Pesa payment");
      const newDeposit: DepositRecord = {
        reference: data.reference,
        status: "pending",
        amountLocal: amount,
        amountUSD: estimatedCreditUSD ?? 0,
        currency: "KES",
        createdAt: new Date().toISOString(),
        resultDescription: data.message,
      };
      setDeposit(newDeposit);
      setRecentDeposits((current) => [newDeposit, ...current]);
      setNotice(data.message || "Check your phone and approve the M-Pesa prompt.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start M-Pesa payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      <Header balance={balance} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4 bg-[#10131A] border border-[#282C35] rounded-2xl p-4 sm:p-6 mb-6">
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block">SAFARICOM KENYA</span>
            <h1 className="text-xl sm:text-2xl font-black">M-Pesa wallet</h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 block">CURRENT VAULT</span>
            <span
              className="text-xl font-mono font-bold text-[#00E575]"
              title={formattedBalance === null ? "Configure WITHDRAWAL_KES_PER_USD to display your balance in KES" : undefined}
            >
              {loading ? "Loading…" : formattedBalance ?? "KSh unavailable"}
            </span>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-amber-700 bg-amber-950/50 p-4 text-sm text-amber-200">
          Deposits are credited only after Safaricom confirms the STK Push. M-Pesa withdrawals are reviewed by an admin and paid manually; requesting a withdrawal does not send an automatic payout.
        </div>

        <form onSubmit={requestDeposit} className="space-y-5 rounded-2xl border border-[#282C35] bg-[#10131A] p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <Wallet size={18} className="text-[#00E575]" /> Deposit with M-Pesa
          </h2>

          <label className="block text-xs font-mono text-zinc-300">
            M-PESA PHONE NUMBER
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0712345678 or 254712345678"
              className="mt-1.5 w-full rounded-xl border border-[#282C35] bg-[#0B0E14] px-4 py-3 text-sm text-white focus:border-[#00E575] focus:outline-none"
            />
          </label>

          <label className="block text-xs font-mono text-zinc-300">
            DEPOSIT AMOUNT (KES)
            <input
              required
              type="number"
              min="1"
              max="250000"
              step="1"
              inputMode="numeric"
              value={amountKES}
              onChange={(event) => setAmountKES(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#282C35] bg-[#0B0E14] px-4 py-3 font-mono text-lg text-white focus:border-[#00E575] focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#282C35] bg-[#0B0E14] p-4">
            <div>
              <span className="block text-xs text-zinc-400">WALLET CREDIT ESTIMATE</span>
              <span className="font-mono text-lg font-bold text-white">
                {estimatedCreditUSD === null ? "Rate unavailable" : `$${estimatedCreditUSD.toFixed(2)} USD`}
              </span>
              {kesPerUsd !== null && (
                <span className="mt-1 block text-[11px] text-zinc-500">
                  KSh {kesPerUsd.toLocaleString("en-KE", { maximumFractionDigits: 2 })} / USD
                  {kesPerUsd === DEFAULT_KES_PER_USD ? " · standard fallback rate" : ""}
                </span>
              )}
            </div>
            <span className="text-right text-xs text-zinc-500">Based on configured KES/USD rate</span>
          </div>

          {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}
          {notice && (
            <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-200">
              {deposit?.status === "pending" ? <Clock3 size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || loading || estimatedCreditUSD === null || estimatedCreditUSD < 0.01}
            className="w-full rounded-xl bg-[#00A859] py-4 text-sm font-bold text-white transition hover:bg-[#00B963] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending STK prompt…" : "Send M-Pesa STK prompt"}
          </button>
        </form>

        <section className="mt-6 rounded-2xl border border-[#282C35] bg-[#10131A] p-5">
          <h2 className="mb-3 font-bold">Recent M-Pesa deposits</h2>
          {recentDeposits.length ? (
            <div className="space-y-2">
              {recentDeposits.map((item) => (
                <div key={item.reference} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#0B0E14] p-3 text-sm">
                  <span className="font-mono text-zinc-200">KSh {item.amountLocal.toLocaleString("en-KE")}</span>
                  <span className="text-zinc-400">${item.amountUSD.toFixed(2)} USD credit</span>
                  <span className={`text-xs font-bold uppercase ${item.status === "completed" ? "text-emerald-300" : item.status === "failed" ? "text-red-300" : "text-amber-300"}`}>
                    {item.status}
                  </span>
                  {item.status === "pending" && item.reference !== deposit?.reference && (
                    <button
                      type="button"
                      onClick={() => void refreshDeposit(item.reference)}
                      className="text-xs text-emerald-300 underline"
                    >
                      Check status
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No deposit requests yet.</p>
          )}
        </section>

        <p className="mt-5 text-center text-sm text-zinc-400">
          Need to withdraw? <Link className="text-emerald-300 underline" href="/withdraw">Request an M-Pesa payout</Link>
        </p>
      </main>
    </div>
  );
}
