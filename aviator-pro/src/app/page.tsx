"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import FlightDeck from "@/components/FlightDeck";
import { GamePhase, IBetSlot } from "@/types";
import { Minus, Plus, Zap, Trophy, Users, ShieldCheck } from "lucide-react";

export default function GamePage() {
  const [balance, setBalance] = useState(250.00);
  const [username, setUsername] = useState("Pilot");
  const [multiplier, setMultiplier] = useState(1.00);
  const [phase, setPhase] = useState<GamePhase>("IN_FLIGHT");
  const [history, setHistory] = useState([3.42, 1.20, 14.50, 2.10, 1.05, 5.80, 2.30]);
  const [crashTarget, setCrashTarget] = useState(4.80);

  const [console1, setConsole1] = useState<IBetSlot>({
    stake: 10, autoCashout: false, autoMultiplier: 2.0, isLocked: true, betId: "b1", hasCashedOut: false, cashedOutMultiplier: null, winAmount: null
  });
  const [console2, setConsole2] = useState<IBetSlot>({
    stake: 5, autoCashout: true, autoMultiplier: 2.5, isLocked: false, betId: null, hasCashedOut: false, cashedOutMultiplier: null, winAmount: null
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setBalance(data.user.balanceUSD);
          setUsername(data.user.username);
        }
      });
  }, []);

  const cashOut1 = useCallback(async () => {
    if (phase !== "IN_FLIGHT" || console1.hasCashedOut || !console1.isLocked) return;
    const payout = parseFloat((console1.stake * multiplier).toFixed(2));
    setBalance(b => b + payout);
    setConsole1(c => ({ ...c, hasCashedOut: true, cashedOutMultiplier: multiplier, winAmount: payout }));
    fetch("/api/game/cashout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stakeAmount: console1.stake, multiplier })
    }).catch(() => {});
  }, [phase, console1, multiplier]);

  const cashOut2 = useCallback(async () => {
    if (phase !== "IN_FLIGHT" || console2.hasCashedOut || !console2.isLocked) return;
    const payout = parseFloat((console2.stake * multiplier).toFixed(2));
    setBalance(b => b + payout);
    setConsole2(c => ({ ...c, hasCashedOut: true, cashedOutMultiplier: multiplier, winAmount: payout }));
    fetch("/api/game/cashout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stakeAmount: console2.stake, multiplier })
    }).catch(() => {});
  }, [phase, console2, multiplier]);

  // Exponential flight loop
  useEffect(() => {
    let start = Date.now();
    let timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const m = parseFloat((1.00 * Math.pow(Math.E, 0.07 * elapsed)).toFixed(2));

      if (console1.isLocked && !console1.hasCashedOut && console1.autoCashout && m >= console1.autoMultiplier) cashOut1();
      if (console2.isLocked && !console2.hasCashedOut && console2.autoCashout && m >= console2.autoMultiplier) cashOut2();

      if (m >= crashTarget) {
        setMultiplier(crashTarget);
        setPhase("CRASHED");
        setHistory(h => [crashTarget, ...h.slice(0, 15)]);
        clearInterval(timer);

        setTimeout(() => {
          setMultiplier(1.0);
          setCrashTarget(parseFloat((1.15 + Math.random() * 6.5).toFixed(2)));
          setPhase("IN_FLIGHT");
          setConsole1(c => ({ ...c, hasCashedOut: false }));
          setConsole2(c => ({ ...c, hasCashedOut: false }));
        }, 3200);
      } else {
        setMultiplier(m);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [phase, crashTarget, console1, console2, cashOut1, cashOut2]);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      <Header balance={balance} username={username} />

      {/* Multiplier pill bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-[#10131A] border-b border-[#282C35]">
        {history.map((h, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold whitespace-nowrap ${
              h >= 10 ? "bg-purple-950 text-purple-300 border border-purple-500/50" :
              h >= 2 ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50" : "bg-[#191C22] text-zinc-400"
            }`}
          >
            {h.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main Responsive Grid: 1 col on mobile, 12 cols on desktop/laptops */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 pb-20 md:pb-6">

        {/* Left Section: Flight Radar & Consoles (8 Cols on laptop) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <FlightDeck multiplier={multiplier} phase={phase} />

          {/* Dual Betting Consoles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CONSOLE 1 */}
            <div className="bg-[#10131A] border border-[#282C35] rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-[#00E575]">CONSOLE 01</span>
                {console1.isLocked && <span className="text-[10px] bg-[#00E575]/20 text-[#00E575] px-1.5 py-0.5 rounded">LOCKED</span>}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#0B0E14] border border-[#282C35] rounded-lg p-1.5 flex items-center justify-between font-mono">
                  <button onClick={() => setConsole1(c => ({ ...c, stake: Math.max(1, c.stake - 5) }))} className="p-1 bg-[#191C22] rounded">
                    <Minus size={14} />
                  </button>
                  <span className="font-bold text-sm">${console1.stake.toFixed(2)}</span>
                  <button onClick={() => setConsole1(c => ({ ...c, stake: c.stake + 5 }))} className="p-1 bg-[#191C22] rounded">
                    <Plus size={14} />
                  </button>
                </div>

                {console1.isLocked && !console1.hasCashedOut && phase === "IN_FLIGHT" ? (
                  <button
                    onClick={cashOut1}
                    className="flex-1 bg-[#00E575] text-[#0B0E14] font-black rounded-lg text-xs flex flex-col items-center justify-center p-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <span>CASH OUT</span>
                    <span className="text-sm font-mono">${(console1.stake * multiplier).toFixed(2)}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (balance < console1.stake) return alert("Please deposit via M-PESA or Airtel first");
                      setBalance(b => b - console1.stake);
                      setConsole1(c => ({ ...c, isLocked: true }));
                    }}
                    className="flex-1 bg-[#E51E3D] hover:bg-[#FF2B4D] text-white font-black rounded-lg text-xs flex flex-col items-center justify-center p-2 active:scale-95 transition-all"
                  >
                    <span>BET</span>
                    <span className="text-sm font-mono">${console1.stake.toFixed(2)}</span>
                  </button>
                )}
              </div>
            </div>

            {/* CONSOLE 2 */}
            <div className="bg-[#10131A] border border-[#282C35] rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-zinc-300">CONSOLE 02</span>
                <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                  <input type="checkbox" checked={console2.autoCashout} onChange={e => setConsole2(c => ({ ...c, autoCashout: e.target.checked }))} className="rounded bg-[#191C22] text-[#00E575]" />
                  Auto 2.50x
                </label>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#0B0E14] border border-[#282C35] rounded-lg p-1.5 flex items-center justify-between font-mono">
                  <button onClick={() => setConsole2(c => ({ ...c, stake: Math.max(1, c.stake - 5) }))} className="p-1 bg-[#191C22] rounded">
                    <Minus size={14} />
                  </button>
                  <span className="font-bold text-sm">${console2.stake.toFixed(2)}</span>
                  <button onClick={() => setConsole2(c => ({ ...c, stake: c.stake + 5 }))} className="p-1 bg-[#191C22] rounded">
                    <Plus size={14} />
                  </button>
                </div>

                {console2.isLocked && !console2.hasCashedOut && phase === "IN_FLIGHT" ? (
                  <button
                    onClick={cashOut2}
                    className="flex-1 bg-[#00E575] text-[#0B0E14] font-black rounded-lg text-xs flex flex-col items-center justify-center p-2 active:scale-95 transition-all"
                  >
                    <span>CASH OUT</span>
                    <span className="text-sm font-mono">${(console2.stake * multiplier).toFixed(2)}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (balance < console2.stake) return alert("Please deposit via M-PESA or Airtel first");
                      setBalance(b => b - console2.stake);
                      setConsole2(c => ({ ...c, isLocked: true }));
                    }}
                    className="flex-1 bg-[#E51E3D] hover:bg-[#FF2B4D] text-white font-black rounded-lg text-xs flex flex-col items-center justify-center p-2 active:scale-95 transition-all"
                  >
                    <span>BET</span>
                    <span className="text-sm font-mono">${console2.stake.toFixed(2)}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right Section: Community Ledger & Live Players (4 Cols on laptop) */}
        <section className="lg:col-span-4 bg-[#10131A] border border-[#282C35] rounded-2xl p-4 flex flex-col">
          <div className="flex justify-between items-center pb-3 border-b border-[#282C35] text-xs font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Users size={14} className="text-[#00E575]" /> Active Orbiters (412)
            </span>
            <span className="text-[#00E575] font-bold">Round #982</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-3 font-mono text-xs">
            <div className="flex justify-between items-center p-2 bg-[#0B0E14] rounded-lg">
              <div>
                <span className="font-bold text-zinc-200">Kamau_KE</span>
                <span className="text-[10px] text-zinc-500 block">M-PESA VIP</span>
              </div>
              <span className="text-zinc-400">$40.00</span>
              <span className="text-[#00E575] font-bold">3.12x +$124.80</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[#0B0E14] rounded-lg">
              <div>
                <span className="font-bold text-zinc-200">AirtelFlyer_UG</span>
                <span className="text-[10px] text-zinc-500 block">Airtel Tier 2</span>
              </div>
              <span className="text-zinc-400">$100.00</span>
              <span className="text-amber-400 font-bold">Flying...</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-[#0B0E14] rounded-lg">
              <div>
                <span className="font-bold text-zinc-200">ValkyrieAce</span>
                <span className="text-[10px] text-zinc-500 block">Paystack</span>
              </div>
              <span className="text-zinc-400">$25.00</span>
              <span className="text-[#00E575] font-bold">4.82x +$120.50</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
