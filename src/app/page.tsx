"use client";
import React from "react";
import Header from "@/components/Header";
import FlightDeck from "@/components/FlightDeck";
import { useAviatorGame } from "@/hooks/useAviatorGame";
import { Minus, Plus, Users, ShieldCheck } from "lucide-react";

export default function GamePage() {
  const { balance, username, phase, multiplier, countdown, roundNumber, history, liveBets, console1, setConsole1, console2, cashOutConsole1, placeBet1, isMuted, toggleSound } = useAviatorGame();
  const isFlight = phase === "IN_FLIGHT";

  return (
    <div className="min-h-screen bg-[#07080B] text-white flex flex-col font-sans">
      <Header balance={balance} username={username} isMuted={isMuted} onToggleSound={toggleSound} />
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 bg-[#0B0E14] border-b border-[#1F242D] no-scrollbar">
        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mr-1">HISTORY</span>
        {history.map((mult, idx) => {
          let pillStyle = "bg-[#191C22] text-zinc-400 border border-zinc-700/40";
          if (mult >= 10.0) pillStyle = "bg-[#3B154D] text-[#D8B4FE] border border-[#A855F7]/60";
          else if (mult >= 2.0) pillStyle = "bg-[#14294D] text-[#93C5FD] border border-[#3B82F6]/60";
          else if (mult >= 50.0) pillStyle = "bg-[#4D3800] text-[#FDE047] border border-[#EAB308]/60 font-black";
          return (
            <span key={idx} className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold whitespace-nowrap ${pillStyle}`}>{mult.toFixed(2)}x</span>
          );
        })}
      </div>
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 pb-16">
        <section className="lg:col-span-8 flex flex-col gap-4">
          <FlightDeck multiplier={multiplier} phase={phase} countdownSeconds={countdown} />
          <div className="flex flex-col gap-3">
            <div className="bg-[#10131A] border border-[#232733] rounded-2xl p-3.5 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 bg-[#2A2F3D] text-white font-bold rounded text-[11px]">Bet</span>
                  <label className="flex items-center gap-1 text-zinc-400 ml-2 cursor-pointer">
                    <input type="checkbox" checked={console1.autoCashout} onChange={(e) => setConsole1((c: any) => ({ ...c, autoCashout: e.target.checked }))} className="rounded bg-[#191C22] border-zinc-700 text-[#00E575] focus:ring-0 w-3 h-3" />
                    <span>Auto @ {console1.autoMultiplier.toFixed(2)}x</span>
                  </label>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold">ID: #B1-KES</span>
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1 bg-[#07080B] border border-[#232733] rounded-xl p-2 flex items-center justify-between font-mono">
                  <button disabled={console1.isLocked} onClick={() => setConsole1((c: any) => ({ ...c, stake: Math.max(50, c.stake - 50) }))} className="w-8 h-8 bg-[#191C22] disabled:opacity-40 text-zinc-300 rounded-lg flex items-center justify-center font-bold text-base hover:text-white">
                    <Minus size={15} />
                  </button>
                  <div className="text-center">
                    <span className="text-[10px] text-zinc-500 block leading-none mb-0.5 font-bold">KSH</span>
                    <span className="font-bold text-base text-white">{console1.stake.toLocaleString()}</span>
                  </div>
                  <button disabled={console1.isLocked} onClick={() => setConsole1((c: any) => ({ ...c, stake: c.stake + 50 }))} className="w-8 h-8 bg-[#191C22] disabled:opacity-40 text-zinc-300 rounded-lg flex items-center justify-center font-bold text-base hover:text-white">
                    <Plus size={15} />
                  </button>
                </div>
                {console1.isLocked && !console1.hasCashedOut && isFlight ? (
                  <button onClick={cashOutConsole1} className="flex-1 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white rounded-xl font-black flex flex-col items-center justify-center p-2.5 shadow-[0_0_24px_rgba(255,122,0,0.5)] active:scale-95 transition-all">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-amber-100">CASH OUT</span>
                    <span className="text-lg font-mono leading-tight font-black">{(console1.stake * multiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="text-[10px] font-mono opacity-90 leading-none">KSH</span>
                  </button>
                ) : (
                  <button disabled={console1.isLocked} onClick={placeBet1} className="flex-1 bg-[#FF7A00] hover:bg-[#FF8C1A] disabled:opacity-50 text-white rounded-xl font-black flex flex-col items-center justify-center p-2.5 active:scale-95 transition-all shadow-lg shadow-orange-500/25">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-amber-100">{console1.isLocked ? "BET ACCEPTED" : "BET"}</span>
                    <span className="text-lg font-mono leading-tight font-black">KSh {console1.stake.toLocaleString()}</span>
                    <span className="text-[10px] opacity-90 leading-none">ROUND #{roundNumber}</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5 mt-2.5">
                {[50, 100, 200, 500, 1000].map(amt => (
                  <button key={amt} disabled={console1.isLocked} onClick={() => setConsole1((c: any) => ({ ...c, stake: amt }))} className="py-1 rounded-lg bg-[#191C22] hover:bg-[#282C35] text-[11px] font-mono text-zinc-300 disabled:opacity-40 font-bold transition-colors">
                    KSh {amt}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#10131A] border border-[#232733] rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="w-full sm:w-auto">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider">LOCKED BET</span>
                <div className="font-mono text-base font-bold text-white">KSh 100</div>
                <div className="text-[11px] font-mono text-[#00E575] flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E575]" /> Instant Payout Credited
                </div>
              </div>
              <div className="w-full sm:w-auto p-2.5 bg-[#0A261C] border border-[#00E575]/60 rounded-xl text-right">
                <span className="text-[10px] font-mono text-[#00E575] font-bold block uppercase tracking-wider">WON @ 12,338.75x</span>
                <div className="text-xs font-mono text-zinc-400">CASHED OUT</div>
                <div className="font-mono text-lg font-black text-white">KSh 1,233,875</div>
              </div>
            </div>
          </div>
        </section>
        <section className="lg:col-span-4 bg-[#10131A] border border-[#232733] rounded-2xl p-4 flex flex-col h-[560px] shadow-2xl">
          <div className="flex justify-between items-center pb-3 border-b border-[#1F242D] text-xs font-mono">
            <span className="flex items-center gap-2 font-bold text-zinc-200"><Users size={16} className="text-[#E51E3D]" /> Active Orbiters ({liveBets.length})</span>
            <span className="text-[#00E575] font-bold">Round #{roundNumber}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 py-3 font-mono text-xs no-scrollbar">
            {liveBets.map((player) => (
              <div key={player.id} className="flex justify-between items-center p-2.5 bg-[#07080B] border border-[#191C22] rounded-xl hover:border-zinc-700 transition-all animate-fadeIn">
                <div>
                  <div className="font-bold text-zinc-200 text-xs">{player.username}</div>
                  <div className="text-[10px] text-zinc-500">KSh {player.stake.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  {player.status === "CASHED_OUT" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-950/80 border border-[#00E575]/50 text-[#00E575] font-bold text-xs">{player.mult?.toFixed(2)}x (+KSh {player.profit.toLocaleString()})</span>
                  ) : player.status === "CRASHED" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-bold text-xs">Crashed</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/50 text-amber-300 font-bold text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> Flying...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-[#1F242D] flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#00E575]" /> SHA-256 Fair: e49a..83fc</span>
            <span className="text-[#E51E3D] font-bold">18+ Play Responsibly</span>
          </div>
        </section>
      </main>
    </div>
  );
}
