'use client';

import React from 'react';
import Header from '@/components/Header';
import FlightDeck from '@/components/FlightDeck';
import WinResultModal from '@/components/WinResultModal';
import { useAviatorGame } from '@/hooks/useAviatorGame';
import { Minus, Plus } from 'lucide-react';

export default function GamePage() {
  const {
    balance,
    phase,
    multiplier,
    history,
    recentWin,
    setRecentWin,
    console1,
    setConsole1,
    console2,
    setConsole2,
    cashOutConsole1,
    cashOutConsole2,
    placeBet1,
    placeBet2,
  } = useAviatorGame();

  const isCrashed = phase === 'CRASHED';

  return (
    <div className="flex-1 flex flex-col">
      <Header balance={balance} />

      {/* History Pill Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-[#10131A] border-b border-[#282C35] no-scrollbar">
        {history.map((mult, index) => {
          let pillBg = 'bg-[#191C22] text-zinc-300';
          if (mult >= 10) pillBg = 'bg-purple-900/60 text-purple-300 border border-purple-500/40';
          else if (mult >= 2) pillBg = 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40';
          else pillBg = 'bg-zinc-800 text-zinc-400';

          return (
            <span
              key={index}
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold whitespace-nowrap ${pillBg}`}
            >
              {mult.toFixed(2)}x
            </span>
          );
        })}
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Real-time Multiplier Radar */}
        <FlightDeck multiplier={multiplier} phase={phase} />

        {/* Dual Betting Consoles */}
        <div className="grid grid-cols-1 gap-2.5">
          {/* CONSOLE 01 */}
          <div className="bg-[#10131A] border border-[#282C35] rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00E575]" />
                <span className="font-mono font-bold text-zinc-200">CONSOLE 01</span>
                {console1.isLocked && (
                  <span className="bg-[#00E575]/20 text-[#00E575] text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                    LOCKED IN
                  </span>
                )}
              </div>
              <div className="flex gap-1 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-[#191C22] text-[#00E575] font-bold">Bet</span>
                <span className="px-2 py-0.5 rounded text-zinc-400">Auto</span>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-[#0B0E14] border border-[#282C35] rounded-lg p-1.5 flex items-center justify-between">
                <button
                  onClick={() => setConsole1((c) => ({ ...c, stake: Math.max(1, c.stake - 5) }))}
                  className="w-7 h-7 bg-[#191C22] text-zinc-300 rounded flex items-center justify-center hover:text-white"
                >
                  <Minus size={14} />
                </button>
                <div className="text-center">
                  <span className="text-[10px] text-zinc-500 font-mono block">$ USD</span>
                  <span className="font-mono font-bold text-sm">{console1.stake.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setConsole1((c) => ({ ...c, stake: c.stake + 5 }))}
                  className="w-7 h-7 bg-[#191C22] text-zinc-300 rounded flex items-center justify-center hover:text-white"
                >
                  <Plus size={14} />
                </button>
              </div>

              {console1.isLocked && !console1.hasCashedOut && !isCrashed ? (
                <button
                  onClick={cashOutConsole1}
                  className="flex-1 bg-[#00E575] hover:bg-[#00FF82] text-[#0B0E14] rounded-lg font-black text-sm flex flex-col items-center justify-center p-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <span className="text-xs uppercase tracking-wider">CASH OUT</span>
                  <span className="text-base font-mono leading-none">
                    ${(console1.stake * multiplier).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-mono opacity-80 leading-none mt-0.5">
                    @ {multiplier.toFixed(2)}x
                  </span>
                </button>
              ) : (
                <button
                  onClick={placeBet1}
                  className="flex-1 bg-[#E51E3D] hover:bg-[#FF2B4D] text-white rounded-lg font-black text-sm flex flex-col items-center justify-center p-2 active:scale-95 transition-all"
                >
                  <span className="text-xs uppercase tracking-wider">BET</span>
                  <span className="text-base font-mono leading-none">${console1.stake.toFixed(2)}</span>
                  <span className="text-[10px] opacity-80 leading-none mt-0.5">NEXT FLIGHT</span>
                </button>
              )}
            </div>

            <div className="flex gap-1.5">
              {[10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setConsole1((c) => ({ ...c, stake: amt }))}
                  className="flex-1 py-1 rounded bg-[#191C22] hover:bg-[#282C35] text-[10px] font-mono text-zinc-300"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* CONSOLE 02 */}
          <div className="bg-[#10131A] border border-[#282C35] rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span className="font-mono font-bold text-zinc-200">CONSOLE 02</span>
                <span className="bg-[#191C22] text-zinc-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  QUEUE
                </span>
              </div>
              <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={console2.autoCashout}
                  onChange={(e) => setConsole2((c) => ({ ...c, autoCashout: e.target.checked }))}
                  className="rounded bg-[#191C22] border-zinc-700 text-[#00E575]"
                />
                Auto @ 2.00x
              </label>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-[#0B0E14] border border-[#282C35] rounded-lg p-1.5 flex items-center justify-between">
                <button
                  onClick={() => setConsole2((c) => ({ ...c, stake: Math.max(1, c.stake - 5) }))}
                  className="w-7 h-7 bg-[#191C22] text-zinc-300 rounded flex items-center justify-center hover:text-white"
                >
                  <Minus size={14} />
                </button>
                <div className="text-center">
                  <span className="text-[10px] text-zinc-500 font-mono block">$ USD</span>
                  <span className="font-mono font-bold text-sm">{console2.stake.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setConsole2((c) => ({ ...c, stake: c.stake + 5 }))}
                  className="w-7 h-7 bg-[#191C22] text-zinc-300 rounded flex items-center justify-center hover:text-white"
                >
                  <Plus size={14} />
                </button>
              </div>

              {console2.isLocked && !console2.hasCashedOut && !isCrashed ? (
                <button
                  onClick={cashOutConsole2}
                  className="flex-1 bg-[#00E575] hover:bg-[#00FF82] text-[#0B0E14] rounded-lg font-black text-sm flex flex-col items-center justify-center p-2 active:scale-95 transition-all"
                >
                  <span className="text-xs uppercase">CASH OUT</span>
                  <span className="text-base font-mono">${(console2.stake * multiplier).toFixed(2)}</span>
                </button>
              ) : (
                <button
                  onClick={placeBet2}
                  className="flex-1 bg-[#E51E3D] hover:bg-[#FF2B4D] text-white rounded-lg font-black text-sm flex flex-col items-center justify-center p-2 active:scale-95 transition-all"
                >
                  <span className="text-xs uppercase">BET</span>
                  <span className="text-base font-mono">${console2.stake.toFixed(2)}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Bets Feed Teaser */}
        <div className="bg-[#10131A] border border-[#282C35] rounded-xl p-3">
          <div className="flex justify-between items-center text-xs font-mono text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E575]" /> 2,419 active pilots
            </span>
            <span>Total Pool: $62,180.00</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#191C22]">
              <span className="text-zinc-300">Valkyrie_09</span>
              <span className="text-zinc-400">$50.00</span>
              <span className="text-[#00E575] font-bold">3.40x +$170.00</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#191C22]">
              <span className="text-zinc-300">Satoshi_K</span>
              <span className="text-zinc-400">$200.00</span>
              <span className="text-[#00E575] font-bold">2.85x +$570.00</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-300">ApexJet</span>
              <span className="text-zinc-400">$15.00</span>
              <span className="text-zinc-500">In Flight ...</span>
            </div>
          </div>
        </div>
      </div>

      <WinResultModal winData={recentWin} onClose={() => setRecentWin(null)} />
    </div>
  );
}
