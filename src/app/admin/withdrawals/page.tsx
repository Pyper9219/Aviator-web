"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [note, setNote] = useState<{ [id: string]: string }>({});

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/withdrawals");
      const data = await res.json();
      if (data.withdrawals) setWithdrawals(data.withdrawals);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (withdrawalId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(withdrawalId);
    try {
      const res = await fetch("/api/admin/withdrawals/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action, adminNote: note[withdrawalId] || "" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      await fetchWithdrawals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = withdrawals.filter((w) => {
    if (filter === "ALL") return true;
    return w.status === filter;
  });

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans">
      <Header balance={0} username="SuperAdmin" />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#10131A] border border-[#282C35] rounded-2xl p-4 sm:p-5 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-mono text-zinc-400 tracking-widest uppercase">
                ADMIN CLEARANCE BACK-OFFICE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1 break-words">Withdrawal Authorization Queue (KSh)</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Authoritative clearance: Approve payouts or reject to immediately refund KSh into the pilot wallet.
            </p>
          </div>
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 sm:gap-3">
            <div className="min-w-0 px-2 sm:px-4 py-2 bg-amber-950/50 border border-amber-500/50 rounded-xl text-[10px] sm:text-xs font-mono text-amber-300">
              PENDING CLEARANCE: <strong>{pendingCount}</strong>
            </div>
            <button
              onClick={fetchWithdrawals}
              disabled={loading}
              className="p-2.5 bg-[#191C22] hover:bg-[#282C35] rounded-xl text-zinc-300 hover:text-white transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 font-mono text-xs">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 sm:px-4 py-2 rounded-xl border transition-all ${
                filter === tab
                  ? "bg-[#E51E3D] border-[#FF2B4D] text-white font-bold"
                  : "bg-[#10131A] border-[#282C35] text-zinc-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Queue Table */}
        <div className="bg-[#10131A] border border-[#282C35] rounded-2xl overflow-hidden shadow-2xl">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 font-mono text-xs">
              No requests currently in {filter.toLowerCase()} state.
            </div>
          ) : (
            <div className="divide-y divide-[#282C35]">
              {filtered.map((w) => (
                <div key={w._id} className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-base">Pilot: {w.username}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#191C22] border border-zinc-700 text-zinc-300">
                        {w.method}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-zinc-400">
                      Destination: <strong className="text-zinc-200">{w.accountNumber}</strong> {w.accountName ? `(${w.accountName})` : ""}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Submitted: {new Date(w.createdAt).toLocaleString()}
                    </div>
                    {w.adminNote && (
                      <div className="text-xs text-zinc-400 italic mt-1">
                        Note: {w.adminNote}
                      </div>
                    )}
                  </div>
                  <div className="text-left lg:text-right">
                    <div className="text-xl font-mono font-black text-[#00E575]">
                      KSh {w.amountKSH.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-2">
                    {w.status === "PENDING" ? (
                      <>
                        <input
                          type="text"
                          placeholder="Optional admin note..."
                          value={note[w._id] || ""}
                          onChange={(e) => setNote({ ...note, [w._id]: e.target.value })}
                          className="w-full sm:w-44 bg-[#0B0E14] border border-[#282C35] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00E575]"
                        />
                        <button
                          disabled={actionLoading === w._id}
                          onClick={() => handleAction(w._id, "APPROVE")}
                          className="w-full sm:w-auto px-4 py-2 bg-[#00E575] hover:bg-[#00FF82] text-[#0B0E14] font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          <CheckCircle2 size={16} />
                          <span>Authorize Payout</span>
                        </button>
                        <button
                          disabled={actionLoading === w._id}
                          onClick={() => handleAction(w._id, "REJECT")}
                          className="w-full sm:w-auto px-4 py-2 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                          <XCircle size={16} />
                          <span>Reject & Refund</span>
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                          w.status === "APPROVED"
                            ? "bg-emerald-950 text-[#00E575] border border-emerald-500/40"
                            : "bg-red-950 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {w.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
