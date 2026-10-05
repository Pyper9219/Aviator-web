"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Smartphone, CreditCard, ShieldCheck, CheckCircle2, Zap, ArrowRight, Loader2 } from "lucide-react";

export default function CashierPage() {
  const [balance, setBalance] = useState(250.0);
  const [method, setMethod] = useState<"MPESA" | "AIRTEL" | "CARD">("MPESA");
  const [phone, setPhone] = useState("07");
  const [amountUSD, setAmountUSD] = useState(25);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) setBalance(data.user.balanceUSD);
      });
  }, []);

  const handleDeposit = async () => {
    setLoading(true);
    setStatusMessage("");
    try {
      const res = await fetch("/api/cashier/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, phone, amountUSD, currency: "KES" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deposit initiation failed");

      setBalance(b => b + amountUSD);
      setStatusMessage(`SUCCESS: STK Push prompt sent to ${phone}. $${amountUSD} has been credited to your cockpit balance.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      <Header balance={balance} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between bg-[#10131A] border border-[#282C35] rounded-2xl p-4 sm:p-6 mb-6">
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block">EAST AFRICA & GLOBAL CASHIER</span>
            <h1 className="text-xl sm:text-2xl font-black">Deposit Flight Funds</h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 block">CURRENT VAULT</span>
            <span className="text-xl font-mono font-bold text-[#00E575]">${balance.toFixed(2)} USD</span>
          </div>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 bg-emerald-950/70 border border-[#00E575] rounded-xl text-xs sm:text-sm text-[#00E575] font-mono">
            {statusMessage}
          </div>
        )}

        {/* Method Picker */}
        <div className="mb-6">
          <label className="text-xs font-mono text-zinc-400 block mb-2">SELECT PAYMENT RAIL</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* M-PESA */}
            <button
              onClick={() => setMethod("MPESA")}
              className={`p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                method === "MPESA" ? "bg-[#191C22] border-[#00A859] ring-2 ring-[#00A859]/30" : "bg-[#10131A] border-[#282C35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00A859] text-white font-black flex items-center justify-center text-xs">
                  M
                </div>
                <div>
                  <div className="font-bold text-white text-sm">M-PESA</div>
                  <div className="text-[10px] text-zinc-400">Safaricom Instant STK</div>
                </div>
              </div>
              {method === "MPESA" && <CheckCircle2 size={18} className="text-[#00A859]" />}
            </button>

            {/* Airtel Money */}
            <button
              onClick={() => setMethod("AIRTEL")}
              className={`p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                method === "AIRTEL" ? "bg-[#191C22] border-[#E31837] ring-2 ring-[#E31837]/30" : "bg-[#10131A] border-[#282C35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E31837] text-white font-black flex items-center justify-center text-xs">
                  A
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Airtel Money</div>
                  <div className="text-[10px] text-zinc-400">Kenya, Uganda, Tanzania</div>
                </div>
              </div>
              {method === "AIRTEL" && <CheckCircle2 size={18} className="text-[#E31837]" />}
            </button>

            {/* Paystack Card */}
            <button
              onClick={() => setMethod("CARD")}
              className={`p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                method === "CARD" ? "bg-[#191C22] border-[#00E575] ring-2 ring-[#00E575]/30" : "bg-[#10131A] border-[#282C35]"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard size={24} className="text-[#00E575]" />
                <div>
                  <div className="font-bold text-white text-sm">Debit / Credit Card</div>
                  <div className="text-[10px] text-zinc-400">Visa / Mastercard / Paystack</div>
                </div>
              </div>
              {method === "CARD" && <CheckCircle2 size={18} className="text-[#00E575]" />}
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="bg-[#10131A] border border-[#282C35] rounded-2xl p-5 space-y-4">
          {(method === "MPESA" || method === "AIRTEL") && (
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">
                {method} REGISTERED MOBILE PHONE NUMBER
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678 or 254712345678"
                className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E575]"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                A PIN prompt (STK push) will appear on your phone to authorize.
              </span>
            </div>
          )}

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1.5">QUICK PRESETS</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[10, 25, 50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmountUSD(amt)}
                  className={`py-2 px-3 rounded-xl border font-mono text-xs font-bold transition-all ${
                    amountUSD === amt
                      ? "bg-[#E51E3D] border-[#FF2B4D] text-white"
                      : "bg-[#0B0E14] border-[#282C35] text-zinc-300 hover:bg-[#191C22]"
                  }`}
                >
                  +${amt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-[#0B0E14] border border-[#282C35] rounded-xl font-mono">
            <div>
              <span className="text-xs text-zinc-400 block">DEPOSIT SUM (USD)</span>
              <span className="text-2xl font-black text-white">${amountUSD.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-400 block">ESTIMATED LOCAL COST</span>
              <span className="text-lg font-bold text-[#00E575]">KES {(amountUSD * 135).toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={loading}
            className="w-full py-4 bg-[#E51E3D] hover:bg-[#FF2B4D] disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-98 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <Zap size={18} />
                <span>Authorize {method} Deposit (${amountUSD.toFixed(2)})</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
