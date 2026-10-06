"use client";

import React from "react";
import { GamePhase } from "@/types";

export default function FlightDeck({ multiplier, phase, countdownSeconds }: { multiplier: number; phase: GamePhase; countdownSeconds: number }) {
  const isCrashed = phase === "CRASHED";
  const isPreparing = phase === "PREPARING";
  const progress = Math.min((multiplier - 1.0) / 4.0, 1.0);
  const planeX = 15 + progress * 68;
  const planeY = 85 - Math.pow(progress, 0.8) * 65;

  return (
    <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-[#0B0E14] overflow-hidden border border-[#282C35] rounded-2xl flex items-center justify-center select-none shadow-2xl">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#191C22_1px,transparent_1px),linear-gradient(to_bottom,#191C22_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-[#10131A]/90 border border-[#282C35] rounded text-[11px] font-mono text-zinc-300">
        <span className={`w-2 h-2 rounded-full ${isCrashed ? "bg-red-500" : "bg-[#00E575] animate-ping"}`} />
        <span>{isCrashed ? "FLEW AWAY" : isPreparing ? "PREPARING" : "IN FLIGHT"}</span>
        <span className="text-zinc-500">|</span>
        <span>ALT: {Math.floor(multiplier * 1840)}M</span>
      </div>

      <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#10131A]/90 border border-[#282C35] rounded text-[11px] font-mono text-zinc-300">
        POOL: <span className="text-[#00E575] font-bold">$42,910.00</span>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path
          d={`M 30 250 Q ${planeX * 3.5} ${planeY * 2.8} ${planeX * 5.2} ${planeY * 3.2}`}
          fill="none"
          stroke={isCrashed ? "#EF4444" : "#E51E3D"}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      <div
        className="absolute transition-all duration-75 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${planeX}%`, top: `${planeY}%` }}
      >
        <div className={`text-3xl sm:text-4xl transform -rotate-12 ${isCrashed ? "filter grayscale opacity-50" : "animate-pulse"}`}>
          🚀
        </div>
      </div>

      <div className="relative z-10 text-center">
        {isCrashed ? (
          <div className="animate-bounce">
            <h2 className="text-red-500 font-extrabold text-3xl sm:text-4xl tracking-widest uppercase">FLEW AWAY!</h2>
            <p className="text-zinc-400 font-mono text-lg mt-1">@ {multiplier.toFixed(2)}x</p>
          </div>
        ) : isPreparing ? (
          <div>
            <div className="text-4xl sm:text-5xl font-black text-amber-400">{countdownSeconds}s</div>
            <div className="mt-2 text-xs font-mono text-zinc-400">NEXT FLIGHT STARTS IN</div>
          </div>
        ) : (
          <div>
            <div className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_25px_rgba(229,30,61,0.5)]">
              {multiplier.toFixed(2)}x
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-2 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E51E3D] animate-ping" />
              COEFFICIENT MULTIPLYING
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[10px] font-mono text-zinc-500">
        <span>{isPreparing ? "BETS OPEN" : "RADAR: ONLINE"}</span>
        <span>LATENCY: 14MS</span>
      </div>
    </div>
  );
}
