"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Building2, CheckCircle2, XCircle, Clock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [method, setMethod] = useState<"MPESA" | "AIRTEL" | "BANK">("MPESA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amountKSH, setAmountKSH] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      if (userData.user) setBalance(userData.user.balanceKSH);
      
      const histRes = await fetch("/api/cashier/withdraw");
      const histData = await histRes.json();
      if (histData.history) setHistory(histData.history);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountKSH > balance) {
      setErrorMsg("Requested amount exceeds your available KSh balance");
      return;
    }
    setLoading(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/cashier/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, accountNumber, accountName, amountKSH })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal request failed");
      
      setStatusMsg(data.message);
      setBalance(data.newBalance);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans">
      <Header balance={balance} />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#10131A] border border-[#282C35] rounded-2xl p-5 mb-6 gap-4">
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block tracking-widest uppercase">
              PILOT VAULT DISBURSEMENT
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Request Withdrawal (KSh)</h1>
            <p className="text-xs text-zinc-400 mt-1">
              All payouts undergo strict 1-tap admin security clearance before mobile dispatch.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-zinc-400 block">AVAILABLE BALANCE</span>
            <span className="text-2xl font-mono font-bold text-[#00E575]">
              KSh {balance.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-6 p-4 bg-emerald-950/70 border border-[#00E575] rounded-xl text-xs sm:text-sm text-[#00E575] font-mono flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{statusMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/70 border border-red-500 rounded-xl text-xs sm:text-sm text-red-300 font-mono flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Withdrawal Form */}
        <div className="bg-[#10131A] border border-[#282C35] rounded-2xl p-5 mb-8">
          <label className="text-xs font-mono text-zinc-400 block mb-2">RECEIVING PAYMENT CHANNEL</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setMethod("MPESA")}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                method === "MPESA" ? "bg-[#191C22] border-[#00A859] ring-2 ring-[#00A859]/30" : "bg-[#0B0E14] border-[#282C35]"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#00A859] text-white font-black flex items-center justify-center text-xs">
                M
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">M-PESA</div>
                <div className="text-[10px] text-zinc-400">Safaricom Kenya</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMethod("AIRTEL")}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                method === "AIRTEL" ? "bg-[#191C22] border-[#E31837] ring-2 ring-[#E31837]/30" : "bg-[#0B0E14] border-[#282C35]"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#E31837] text-white font-black flex items-center justify-center text-xs">
                A
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Airtel Money</div>
                <div className="text-[10px] text-zinc-400">Kenya</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMethod("BANK")}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                method === "BANK" ? "bg-[#191C22] border-[#00E575] ring-2 ring-[#00E575]/30" : "bg-[#0B0E14] border-[#282C35]"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#191C22] border border-zinc-700 text-[#00E575] flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Bank Wire</div>
                <div className="text-[10px] text-zinc-400">Direct Account Transfer</div>
              </div>
            </button>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">
                {method === "BANK" ? "BANK ACCOUNT NUMBER" : `${method} REGISTERED MOBILE NUMBER`}
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0712345678 or 254712345678"
                className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E575]"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">ACCOUNT HOLDER FULL NAME</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Official name matching your mobile money account"
                className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E575]"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">WITHDRAWAL AMOUNT (KSH)</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {[500, 1000, 2000, 5000, 10000, 20000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountKSH(amt)}
                    className={`py-2 px-3 rounded-xl border font-mono text-xs font-bold transition-all ${
                      amountKSH === amt
                        ? "bg-[#00E575] border-[#00FF82] text-[#0B0E14]"
                        : "bg-[#0B0E14] border-[#282C35] text-zinc-300 hover:bg-[#191C22]"
                    }`}
                  >
                    KSh {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || balance < amountKSH}
              className="w-full py-4 bg-[#00E575] hover:bg-[#00FF82] disabled:opacity-50 text-[#0B0E14] font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Request Withdrawal (KSh {amountKSH.toLocaleString()})</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Status Tracking */}
        <div>
          <h2 className="text-sm font-mono font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-[#00E575]" />
            Your Withdrawal Requests & Approval Status
          </h2>
          <div className="bg-[#10131A] border border-[#282C35] rounded-2xl overflow-hidden">
            {history.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-500">
                No withdrawal requests found.
              </div>
            ) : (
              <div className="divide-y divide-[#282C35]">
                {history.map((item) => (
                  <div key={item._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">KSh {item.amountKSH.toLocaleString()}</span>
                        <span className="text-xs font-mono text-zinc-400">({item.method} • {item.accountNumber})</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        Requested on {new Date(item.createdAt).toLocaleString()}
                      </div>
                      {item.adminNote && (
                        <div className="text-[11px] text-zinc-400 mt-1 italic">
                          Admin note: {item.adminNote}
                        </div>
                      )}
                    </div>
                    <div>
                      {item.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-300 font-mono text-xs font-bold animate-pulse">
                          <Clock size={14} /> Awaiting Admin Clearance
                        </span>
                      ) : item.status === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-[#00E575]/60 text-[#00E575] font-mono text-xs font-bold">
                          <CheckCircle2 size={14} /> Approved & Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/60 text-red-400 font-mono text-xs font-bold">
                          <XCircle size={14} /> Rejected & Refunded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
