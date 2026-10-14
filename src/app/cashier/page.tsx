"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Smartphone, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function CashierPage() {
  const [balance, setBalance] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amountKSH, setAmountKSH] = useState(500);
  const [loading, setLoading] = useState(false);
  const [waitingForPin, setWaitingForPin] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setBalance(data.user.balanceKSH);
        if (!phoneNumber && data.user.phoneOrEmail) {
          setPhoneNumber(data.user.phoneOrEmail);
        }
      }
    } catch (e) {}
  };

  useEffect(() => { fetchBalance(); }, []);

  useEffect(() => {
    if (!waitingForPin || !checkoutRequestId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cashier/mpesa/status?checkoutRequestId=${checkoutRequestId}`);
        const data = await res.json();
        if (data.status === "COMPLETED") {
          clearInterval(interval);
          setWaitingForPin(false);
          setStatusMsg(`Payment Confirmed! Ref: ${data.receiptNumber}. KSh ${data.amountKSH.toLocaleString()} credited to your balance.`);
          setBalance(data.newBalance);
        } else if (data.status === "FAILED") {
          clearInterval(interval);
          setWaitingForPin(false);
          setErrorMsg(data.resultDesc || "M-PESA transaction was cancelled or timed out.");
        }
      } catch (e) {}
    }, 2500);
    return () => clearInterval(interval);
  }, [waitingForPin, checkoutRequestId]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/cashier/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, amountKSH }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger M-PESA prompt");
      setCheckoutRequestId(data.checkoutRequestId);
      setWaitingForPin(true);
      setStatusMsg(data.message);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-white flex flex-col font-sans">
      <Header balance={balance} />
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-[#10131A] border border-[#282C35] rounded-2xl p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00A859] shadow-[0_0_8px_#00A859]" />
              <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest uppercase">INSTANT M-PESA EXPRESS DEPOSIT</span>
            </div>
            <h1 className="text-2xl font-black mt-1">Direct M-PESA Cashier (KSh)</h1>
            <p className="text-xs text-zinc-400 mt-1">Funds are credited to your flight deck immediately upon entering your M-PESA PIN.</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-zinc-400 block">CURRENT BALANCE</span>
            <span className="text-2xl font-mono font-black text-[#00E575]">KSh {balance.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-6 p-4 bg-emerald-950/70 border border-[#00E575] rounded-xl text-xs sm:text-sm text-[#00E575] font-mono flex items-start gap-2.5">
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">{statusMsg}</p>
              {waitingForPin && (
                <div className="flex items-center gap-2 text-zinc-300 mt-1">
                  <Loader2 size={14} className="animate-spin text-[#00E575]" />
                  <span>Waiting for you to enter PIN on your phone...</span>
                </div>
              )}
            </div>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/70 border border-red-500 rounded-xl text-xs sm:text-sm text-red-300 font-mono flex items-center gap-2">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-[#10131A] border border-[#282C35] rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#282C35]">
            <div className="w-12 h-12 rounded-xl bg-[#00A859] text-white font-black flex items-center justify-center text-xl shadow-lg shadow-green-500/20">M</div>
            <div>
              <h2 className="font-black text-lg">Lipa Na M-PESA Online (STK Push)</h2>
              <p className="text-xs text-zinc-400">Zero transaction delays • Instant automated credit</p>
            </div>
          </div>

          <form onSubmit={handleDeposit} className="space-y-5">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5 flex items-center justify-between">
                <span>SAFARICOM M-PESA PHONE NUMBER</span>
                <span className="text-[10px] text-zinc-500">e.g. 0712345678 or 254712345678</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Smartphone size={18} />
                </div>
                <input
                  type="tel"
                  required
                  disabled={waitingForPin}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full bg-[#07080B] border border-[#282C35] rounded-xl pl-11 pr-4 py-3 text-base text-white font-mono focus:outline-none focus:border-[#00E575]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-2">SELECT DEPOSIT AMOUNT (KSH)</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={waitingForPin}
                    onClick={() => setAmountKSH(amt)}
                    className={`py-2.5 px-2 rounded-xl border font-mono text-xs font-bold transition-all ${
                      amountKSH === amt
                        ? "bg-[#00E575] border-[#00FF82] text-[#0B0E14] shadow-md shadow-emerald-500/20"
                        : "bg-[#07080B] border-[#282C35] text-zinc-300 hover:bg-[#191C22]"
                    }`}
                  >
                    KSh {amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="10"
                step="10"
                disabled={waitingForPin}
                value={amountKSH}
                onChange={(e) => setAmountKSH(Number(e.target.value))}
                className="w-full bg-[#07080B] border border-[#282C35] rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00E575]"
                placeholder="Or enter custom amount in KSh"
              />
            </div>

            <button
              type="submit"
              disabled={loading || waitingForPin || amountKSH < 10}
              className="w-full py-4 bg-[#00A859] hover:bg-[#00BD64] disabled:opacity-50 text-white font-black rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-98 transition-all"
            >
              {loading || waitingForPin ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{waitingForPin ? "Awaiting PIN on phone..." : "Triggering STK Push..."}</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Send M-PESA STK Push (KSh {amountKSH.toLocaleString()})</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#1F242D] flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <ShieldCheck size={14} className="text-[#00E575]" /> Safaricom Daraja SSL 256-bit Encrypted
            </span>
            <span className="text-[#E51E3D] font-bold">Direct Automated Vault</span>
          </div>
        </div>
      </main>
    </div>
  );
}
