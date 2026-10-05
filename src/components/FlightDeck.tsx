'use client';

import React from 'react';
import { GamePhase } from '@/types';

interface FlightDeckProps {
  multiplier: number;
  phase: GamePhase;
}

export default function FlightDeck({ multiplier, phase }: FlightDeckProps) {
  const isCrashed = phase === 'CRASHED';

  const progress = Math.min((multiplier - 1.0) / 4.0, 1.0);
  const planeX = 15 + progress * 68;
  const planeY = 85 - Math.pow(progress, 0.8) * 65;

  return (
    <div className="relative w-full h-64 bg-[#0B0E14] overflow-hidden border border-[#282C35] rounded-xl flex items-center justify-center select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#191C22_1px,transparent_1px),linear-gradient(to_bottom,#191C22_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />

      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-[#10131A]/80 border border-[#282C35] rounded text-[10px] font-mono text-zinc-300">
        <span className={`w-1.5 h-1.5 rounded-full ${isCrashed ? 'bg-red-500' : 'bg-[#00E575] animate-ping'}`} />
        <span>{isCrashed ? 'FLEW AWAY' : 'AIRBORNE'}</span>
        <span className="text-zinc-500">|</span>
        <span className="text-zinc-400">ALT: {Math.floor(multiplier * 2140)}M</span>
      </div>

      <div className="absolute top-3 right-3 px-2 py-1 bg-[#10131A]/80 border border-[#282C35] rounded text-[10px] font-mono text-zinc-400">
        ROUND POOL: <span className="text-[#00E575] font-bold">$38,490.12</span>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path
          d={`M 20 220 Q ${planeX * 2.5} ${planeY * 2.2} ${planeX * 3.8} ${planeY * 2.5}`}
          fill="none"
          stroke={isCrashed ? '#EF4444' : '#E51E3D'}
          strokeWidth="3.5"
          strokeLinecap="round"
          className="transition-all duration-75"
        />
      </svg>

      <div
        className="absolute transition-all duration-75 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${planeX}%`, top: `${planeY}%` }}
      >
        <div className={`text-2xl transform -rotate-12 ${isCrashed ? 'filter grayscale opacity-60' : 'animate-pulse'}`}>
          🚀
        </div>
      </div>

      <div className="relative z-10 text-center">
        {isCrashed ? (
          <div className="animate-bounce">
            <h2 className="text-red-500 font-extrabold text-2xl tracking-widest uppercase">FLEW AWAY!</h2>
            <p className="text-zinc-400 font-mono text-lg mt-0.5">@ {multiplier.toFixed(2)}x</p>
          </div>
        ) : (
          <div>
            <div className="text-6xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_20px_rgba(229,30,61,0.4)]">
              {multiplier.toFixed(2)}x
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-mono tracking-wider mt-1">
              <span className="w-2 h-2 rounded-full bg-[#E51E3D] animate-ping" />
              CRASH COEFFICIENT CLIMBING
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] font-mono text-zinc-500">
        <span>X-ORBIT: {isCrashed ? 'TERMINATED' : 'STABLE'}</span>
        <span>LATENCY: 18ms</span>
      </div>
    </div>
  );
}
