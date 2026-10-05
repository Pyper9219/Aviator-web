'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import { CreditCard, Zap, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function CashierPage() {
  const [amountUSD, setAmountUSD] = useState<number>(100);
  const [email, setEmail] = useState<string>('pilot@aerocrash.game');
  const [currency, setCurrency] = useState<string>('NGN');
  const [loading, setLoading] = useState<boolean>(false);

  const presets = [25, 50, 100, 250, 500, 1000];

  const handlePaystackDeposit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cashier/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUSD,
          email,
          currency,
        }),
      });

      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        alert(data.error || 'Failed to initialize Paystack checkout');
      }
    } catch (e: any) {
      alert(e.message || 'Payment network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header balance={4850.50} />

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between bg-[#10131A] p-3 rounded-xl border border-[#282C35]">
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block">TERMINAL NODE #04</span>
            <h1 className="text-lg font-bold text-white">Fast Deposit</h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 block">CURRENT VAULT</span>
            <span className="text-base font-mono font-bold text-[#00E575]">$4,850.50 USD</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-950/40 to-[#10131A] border border-purple-500/40 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Zap size={14} className="text-purple-400 fill-purple-400" />
              100% FLIGHT BOOSTER ACTIVE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200">
              +5 Safe Ejects
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Matches deposit 1:1 up to $1,000 + 5 free crash insurance rounds loaded instantly to your HUD.
          </p>
        </div>

        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1.5">PAYMENT GATEWAY</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCurrency('NGN')}
              className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                currency === 'NGN' ? 'bg-[#191C22] border-[#00E575]' : 'bg-[#10131A] border-[#282C35] text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#00E575]" />
                <div>
                  <div className="text-xs font-bold text-white">Paystack Card/Bank</div>
                  <div className="text-[10px] text-zinc-400">NGN / GHS / ZAR</div>
                </div>
              </div>
              {currency === 'NGN' && <CheckCircle2 size={16} className="text-[#00E575]" />}
            </button>

            <button
              onClick={() => setCurrency('USD')}
              className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                currency === 'USD' ? 'bg-[#191C22] border-[#00E575]' : 'bg-[#10131A] border-[#282C35] text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Direct USD Rail</div>
                  <div className="text-[10px] text-zinc-400">International</div>
                </div>
              </div>
              {currency === 'USD' && <CheckCircle2 size={16} className="text-[#00E575]" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1.5">RECEIPT EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#10131A] border border-[#282C35] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00E575]"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1.5">INJECTION PRESETS</label>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setAmountUSD(p)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  amountUSD === p
                    ? 'bg-[#E51E3D] border-[#FF2B4D] text-white shadow-lg shadow-red-500/20'
                    : 'bg-[#10131A] border-[#282C35] text-zinc-300 hover:bg-[#191C22]'
                }`}
              >
                +${p} USD
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#10131A] border border-[#282C35] rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">DEPOSIT SUM</span>
          <div className="text-xl font-mono font-black text-white">
            ${amountUSD.toFixed(2)} <span className="text-xs text-zinc-400 font-normal">USD</span>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={handlePaystackDeposit}
            disabled={loading}
            className="w-full bg-[#E51E3D] hover:bg-[#FF2B4D] disabled:opacity-50 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-98 transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <CreditCard size={18} />
                <span>Pay with Paystack (${amountUSD.toFixed(2)})</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-3">
            <ShieldCheck size={14} className="text-[#00E575]" />
            <span>256-BIT ENCRYPTED • INSTANT HUD BALANCE ALLOCATION</span>
          </div>
        </div>
      </div>
    </div>
  );
}
