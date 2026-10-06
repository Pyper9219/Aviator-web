"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, Clock3, RefreshCcw, Wallet } from "lucide-react";
import type { WithdrawalCurrency, WithdrawalMethod, WithdrawalRates } from "@/lib/withdrawals";

interface WithdrawalRecord {
  _id: string;
  amountUSD: number;
  amountLocal: number;
  currency: WithdrawalCurrency;
  exchangeRate: number;
  method: WithdrawalMethod;
  recipientName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  paidAt?: string;
  createdAt: string;
}

const emptyRates: WithdrawalRates = { KES: null, UGX: null };

export default function WithdrawPage() {
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [rates, setRates] = useState<WithdrawalRates>(emptyRates);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [amountUSD, setAmountUSD] = useState("");
  const [currency, setCurrency] = useState<WithdrawalCurrency>("KES");
  const [method, setMethod] = useState<WithdrawalMethod>("MPESA");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadWithdrawals() {
    const response = await fetch("/api/withdrawals", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load withdrawal information");
    setWithdrawableBalance(data.withdrawableBalanceUSD);
    setLockedBalance(data.lockedBalanceUSD);
    setRates(data.rates);
    setHistory(data.withdrawals);
  }

  useEffect(() => {
    loadWithdrawals()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load withdrawals"))
      .finally(() => setLoading(false));
  }, []);

  const numericAmount = Number(amountUSD);
  const estimatedLocal = rates[currency] && Number.isFinite(numericAmount)
    ? Math.round(numericAmount * rates[currency]!)
    : null;

  async function submitWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUSD: numericAmount,
          currency,
          method,
          recipientName,
          phone,
          bankName,
          accountNumber
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Withdrawal request failed");
      setAmountUSD("");
      setNotice("Request submitted. Funds are locked until an admin reviews it.");
      await loadWithdrawals();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Withdrawal request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0E14] text-white px-4 py-8 pb-24">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft size={16} /> Back to flight deck
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-black">Withdraw funds</h1>
          <p className="mt-1 text-sm text-zinc-400">Requests require admin approval before the payout can proceed.</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#282C35] bg-[#10131A] p-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400"><Wallet size={15} /> AVAILABLE WITHDRAWABLE CASH</div>
            <div className="mt-2 text-2xl font-bold text-[#00E575]">${withdrawableBalance.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-[#282C35] bg-[#10131A] p-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400"><Clock3 size={15} /> LOCKED IN WITHDRAWALS</div>
            <div className="mt-2 text-2xl font-bold">${lockedBalance.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={submitWithdrawal} className="space-y-4 rounded-xl border border-[#282C35] bg-[#10131A] p-5">
            <h2 className="flex items-center gap-2 font-bold"><Banknote size={18} className="text-[#00E575]" /> New withdrawal</h2>

            <label className="block text-xs text-zinc-300">
              Amount (USD)
              <input
                type="number"
                min="0.01"
                max={withdrawableBalance}
                step="0.01"
                required
                value={amountUSD}
                onChange={(event) => setAmountUSD(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#282C35] bg-[#0B0E14] px-3 py-2 text-sm text-white"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-zinc-300">
                Payout method
                <select value={method} onChange={(event) => setMethod(event.target.value as WithdrawalMethod)} className="mt-1 w-full rounded-lg border border-[#282C35] bg-[#0B0E14] px-3 py-2 text-sm">
                  <option value="MPESA">M-PESA</option>
                  <option value="AIRTEL">Airtel Money</option>
                  <option value="BANK_WIRE">Bank wire</option>
                </select>
              </label>
              <label className="block text-xs text-zinc-300">
                Payout currency
                <select value={currency} onChange={(event) => setCurrency(event.target.value as WithdrawalCurrency)} className="mt-1 w-full rounded-lg border border-[#282C35] bg-[#0B0E14] px-3 py-2 text-sm">
                  <option value="KES">KES</option>
                  <option value="UGX">UGX</option>
                </select>
              </label>
            </div>

            <label className="block text-xs text-zinc-300">
              Recipient full name
              <input required maxLength={100} value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="mt-1 w-full rounded-lg border border-[#282C35] bg-[#0B0E14] px-3 py-2 text-sm" />
            </label>

            {method === "BANK_WIRE" ? (
              <>
                <label className="block text-xs text-zinc-300">
                  Bank name
                  <input required maxLength={100} value={bankName} onChange={(event) => setBankName(event.target.value)} className="mt-1 w-full rounded-lg border border-[#282C35] bg-[#0B0E14] px-3 py-2 text-sm" />
                </label>
                <label className="block text-xs text-zinc-300">
                  Account number
                  <input required minLength={4} maxLength={50} value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} className="mt-1 w-full rounded-lg border border-[#282C35] bg-[#0B0E14] px-3 py-2 text-sm" />
                </label>
              </>
            ) : (
              <label className="block text-xs text-zinc-300">
                Mobile-money phone number
                <input required type="tel" maxLength={20} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254..." className="mt-1 w-full rounded-lg border border-[#282C35] bg-[#0B0E14] px-3 py-2 text-sm" />
              </label>
            )}

            <p className="rounded-lg bg-[#0B0E14] p-3 text-xs text-zinc-400">
              {rates[currency]
                ? `Estimated payout: ${currency} ${estimatedLocal?.toLocaleString() ?? "—"} at ${rates[currency]} ${currency}/USD. The rate is saved with this request.`
                : `Payout estimate unavailable: ${currency} conversion rate has not been configured.`}
            </p>

            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            {notice && <p role="status" className="text-sm text-emerald-400">{notice}</p>}
            <button disabled={submitting || loading || !rates[currency]} className="w-full rounded-lg bg-[#00E575] px-4 py-3 font-bold text-[#0B0E14] disabled:opacity-50">
              {submitting ? "Submitting..." : "Request withdrawal"}
            </button>
          </form>

          <section className="rounded-xl border border-[#282C35] bg-[#10131A] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Withdrawal history</h2>
              <button onClick={() => { setLoading(true); loadWithdrawals().catch((e: unknown) => setError(e instanceof Error ? e.message : "Refresh failed")).finally(() => setLoading(false)); }} aria-label="Refresh withdrawal history" className="text-zinc-400 hover:text-white">
                <RefreshCcw size={16} />
              </button>
            </div>
            {loading ? <p className="text-sm text-zinc-400">Loading requests...</p> : history.length === 0 ? (
              <p className="text-sm text-zinc-400">No withdrawal requests yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <article key={item._id} className="rounded-lg border border-[#282C35] bg-[#0B0E14] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">${item.amountUSD.toFixed(2)} · {item.method.replace("_", " ")}</div>
                        <div className="mt-1 text-xs text-zinc-400">{item.recipientName} · {item.currency} {item.amountLocal.toLocaleString()}</div>
                        <div className="mt-1 text-[11px] text-zinc-500">{new Date(item.createdAt).toLocaleString()}</div>
                      </div>
                      <span className={`rounded px-2 py-1 text-[10px] font-bold ${item.status === "PENDING" ? "bg-amber-950 text-amber-300" : item.status === "APPROVED" ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"}`}>
                        {item.status === "REJECTED" ? "Rejected & refunded" : item.status}
                      </span>
                    </div>
                    {item.status === "APPROVED" && <p className="mt-2 text-xs text-emerald-300">{item.paidAt ? "Payout recorded as sent" : "Approved; awaiting manual payout"}</p>}
                    {item.rejectionReason && <p className="mt-2 text-xs text-red-300">{item.rejectionReason}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
