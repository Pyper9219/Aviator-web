"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { CheckCircle2, AlertCircle, Loader2, Smartphone, CreditCard } from "lucide-react";

export default function CashierPage() {
  const [balance, setBalance] = useState(0);
  const [method, setMethod] = useState<"MPESA" | "AIRTEL" | "PAYSTACK">("MPESA");
  const [amountKSH, setAmountKSH] = useState(500);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(res => res.json()).then(data => {
      if (data.user) setBalance(data.user.balanceKSH);
    });
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountKSH < 50) { setErrorMsg("Minimum deposit is KSh 50"); return; }
    setLoading(true); setStatusMsg(""); setErrorMsg("");

    try {
      const res = await fetch("/api/cashier/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, amountKSH, phoneNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg(data.message);
      setBalance(data.newBalance);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans">
      <Header balance={balance} />
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-[#10131A] border border-[#282C35] rounded-2xl p-6 mb-6 text-center">
          <span className="text-[10px] font-mono text-zinc-400 block tracking-widest uppercase">Available Balance</span>
          <span className="text-4xl font-mono font-black text-[#00E575]">KSh {balance.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
        </div>

        {statusMsg && <div className="mb-6 p-4 bg-emerald-950/70 border border-[#00E575] rounded-xl text-sm text-[#00E575] font-mono flex items-center gap-2"><CheckCircle2 size={18} />{statusMsg}</div>}
        {errorMsg && <div className="mb-6 p-4 bg-red-950/70 border border-red-500 rounded-xl text-sm text-red-300 font-mono flex items-center gap-2"><AlertCircle size={18} />{errorMsg}</div>}

        <div className="bg-[#10131A] border border-[#282C35] rounded-2xl p-6">
          <h2 className="text-lg font-black mb-4">Deposit Funds</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <button onClick={() => setMethod("MPESA")} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === "MPESA" ? "bg-[#191C22] border-[#00A859] ring-2 ring-[#00A859]/30" : "bg-[#0B0E14] border-[#282C35]"}`}>
              <Smartphone size={24} className="text-[#00A859]" />
              <span className="font-bold text-sm">M-PESA</span>
            </button>
            <button onClick={() => setMethod("AIRTEL")} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === "AIRTEL" ? "bg-[#191C22] border-[#E31837] ring-2 ring-[#E31837]/30" : "bg-[#0B0E14] border-[#282C35]"}`}>
              <Smartphone size={24} className="text-[#E31837]" />
              <span className="font-bold text-sm">Airtel Money</span>
            </button>
            <button onClick={() => setMethod("PAYSTACK")} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === "PAYSTACK" ? "bg-[#191C22] border-[#00E575] ring-2 ring-[#00E575]/30" : "bg-[#0B0E14] border-[#282C35]"}`}>
              <CreditCard size={24} className="text-[#00E575]" />
              <span className="font-bold text-sm">Paystack</span>
            </button>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            {(method === "MPESA" || method === "AIRTEL") && (
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">MOBILE NUMBER</label>
                <input type="text" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 0712345678" className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E575]" />
              </div>
            )}
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">AMOUNT (KSH)</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[100, 500, 1000, 2000, 5000, 10000].map((amt) => (
                  <button key={amt} type="button" onClick={() => setAmountKSH(amt)} className={`py-2 px-3 rounded-xl border font-mono text-xs font-bold transition-all ${amountKSH === amt ? "bg-[#00E575] border-[#00FF82] text-[#0B0E14]" : "bg-[#0B0E14] border-[#282C35] text-zinc-300 hover:bg-[#191C22]"}`}>
                    KSh {amt}
                  </button>
                ))}
              </div>
              <input type="number" required value={amountKSH} onChange={(e) => setAmountKSH(Number(e.target.value))} className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E575]" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 bg-[#00E575] hover:bg-[#00FF82] disabled:opacity-50 text-[#0B0E14] font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all">
              {loading ? <Loader2 className="animate-spin" size={20} /> : `Deposit KSh ${amountKSH.toLocaleString()}`}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
