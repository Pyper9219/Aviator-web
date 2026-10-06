"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock3, RefreshCcw, X } from "lucide-react";
import type { WithdrawalCurrency, WithdrawalMethod } from "@/lib/withdrawals";

interface AdminWithdrawal {
  _id: string;
  userId: string;
  username: string;
  contact: string;
  amountUSD: number;
  currency: WithdrawalCurrency;
  amountLocal: number;
  exchangeRate: number;
  method: WithdrawalMethod;
  recipientName: string;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  paidAt?: string;
  createdAt: string;
}

export default function AdminWithdrawalsPage() {
  const [rows, setRows] = useState<AdminWithdrawal[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/withdrawals", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load withdrawal queue");
    setRows(data.withdrawals);
  }, []);

  useEffect(() => {
    load().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load queue")).finally(() => setLoading(false));
  }, [load]);

  async function act(row: AdminWithdrawal, action: "approve" | "reject" | "mark-paid") {
    let reason: string | undefined;
    if (action === "reject") {
      reason = window.prompt("Reason for rejecting this withdrawal?")?.trim();
      if (!reason) return;
    }
    if (action === "approve" && !window.confirm("Approve this withdrawal? It will remain reserved until the manual payout is recorded.")) return;
    if (action === "mark-paid" && !window.confirm("Confirm that you sent the payout externally. This releases the reserved balance.")) return;

    setBusyId(row._id);
    setError("");
    try {
      const response = await fetch(`/api/admin/withdrawals/${row._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update request");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update request");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0E14] px-4 py-8 pb-24 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft size={16} /> Flight deck
        </Link>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Withdrawal admin cockpit</h1>
            <p className="mt-1 text-sm text-zinc-400">Approval authorizes a manual payout. Record it as paid only after sending it externally.</p>
          </div>
          <button onClick={() => { setLoading(true); load().catch((e: unknown) => setError(e instanceof Error ? e.message : "Refresh failed")).finally(() => setLoading(false)); }} aria-label="Refresh withdrawals" className="rounded-lg border border-[#282C35] p-2 text-zinc-300 hover:text-white">
            <RefreshCcw size={17} />
          </button>
        </div>
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
        {loading ? <p className="text-sm text-zinc-400">Loading requests...</p> : rows.length === 0 ? (
          <p className="rounded-xl border border-[#282C35] bg-[#10131A] p-5 text-sm text-zinc-400">No withdrawal requests.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <article key={row._id} className="rounded-xl border border-[#282C35] bg-[#10131A] p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold">
                      ${row.amountUSD.toFixed(2)}
                      <span className={`rounded px-2 py-0.5 text-[10px] ${row.status === "PENDING" ? "bg-amber-950 text-amber-300" : row.status === "APPROVED" ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"}`}>{row.status}</span>
                      {row.status === "APPROVED" && row.paidAt && <span className="text-[10px] text-emerald-300">PAID</span>}
                    </div>
                    <div className="mt-2 text-sm">{row.username} <span className="text-zinc-500">({row.contact})</span></div>
                    <div className="mt-1 text-xs text-zinc-400">User ID: {row.userId}</div>
                    <div className="mt-2 text-sm">{row.method.replace("_", " ")} · {row.recipientName}</div>
                    <div className="mt-1 text-sm text-[#00E575]">{row.currency} {row.amountLocal.toLocaleString()} <span className="text-xs text-zinc-500">(locked rate {row.exchangeRate} {row.currency}/USD)</span></div>
                    <div className="mt-1 text-xs text-zinc-400">{row.phone || `${row.bankName ?? ""} · ${row.accountNumber ?? ""}`} · {new Date(row.createdAt).toLocaleString()}</div>
                    {row.rejectionReason && <p className="mt-2 text-xs text-red-300">Reason: {row.rejectionReason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.status === "PENDING" && <>
                      <button disabled={busyId === row._id} onClick={() => act(row, "approve")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold disabled:opacity-50"><Check size={14} /> Approve</button>
                      <button disabled={busyId === row._id} onClick={() => act(row, "reject")} className="inline-flex items-center gap-1 rounded-lg bg-red-800 px-3 py-2 text-xs font-bold disabled:opacity-50"><X size={14} /> Reject & refund</button>
                    </>}
                    {row.status === "APPROVED" && !row.paidAt && <button disabled={busyId === row._id} onClick={() => act(row, "mark-paid")} className="inline-flex items-center gap-1 rounded-lg bg-[#00E575] px-3 py-2 text-xs font-bold text-[#0B0E14] disabled:opacity-50"><Clock3 size={14} /> Record payout sent</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
