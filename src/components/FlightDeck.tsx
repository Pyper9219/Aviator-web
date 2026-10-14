"use client";
import React, { useEffect, useRef, useState } from "react";
import { GamePhase } from "@/types";

interface FlightDeckProps {
  multiplier: number;
  phase: GamePhase;
  countdownSeconds: number;
}

export default function FlightDeck({ multiplier, phase, countdownSeconds }: FlightDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ width: 720, height: 420 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDim({
          width: containerRef.current.clientWidth || 720,
          height: containerRef.current.clientHeight || 420,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isPreparing = phase === "PREPARING";
  const isCrashed = phase === "CRASHED";
  const isFlight = phase === "IN_FLIGHT";

  const W = dim.width;
  const H = dim.height;

  // Coordinate origin matching the reference canvas layout
  const originX = 42;
  const originY = H - 36;
  const usableWidth = W - originX - 44;
  const usableHeight = originY - 50;

  // Normalized exponential climb progress
  const progress = Math.min(Math.max((multiplier - 1.0) / 8.5, 0), 1);
  const curveT = Math.pow(progress, 0.85);
  const planeX = originX + curveT * usableWidth;
  const planeY = originY - Math.pow(curveT, 1.48) * usableHeight;

  // Tangent calculation for real-time nose pitch tilt
  const controlX = originX + (planeX - originX) * 0.55;
  const controlY = originY;
  const deltaX = (1 - curveT) * (controlX - originX) + curveT * (planeX - controlX);
  const deltaY = (1 - curveT) * (controlY - originY) + curveT * (planeY - controlY);
  const angleRad = Math.atan2(deltaY, deltaX);
  const angleDeg = isFlight ? Math.min(Math.max(angleRad * (180 / Math.PI), -42), 8) : 0;

  // Trajectory curve and solid vertical-drop wedge fill
  const curvePath = `M ${originX} ${originY} Q ${controlX} ${controlY} ${planeX} ${planeY}`;
  const solidWedgePath = `M ${originX} ${originY} Q ${controlX} ${controlY} ${planeX} ${planeY} L ${planeX} ${originY} Z`;

  return (
    <div ref={containerRef} className="relative w-full h-76 sm:h-88 md:h-96 lg:h-[460px] bg-[#07080B] overflow-hidden border-2 border-white/90 rounded-[28px] flex items-center justify-center select-none shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
      
      {/* 1. Deep Sunburst Sector Rays */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <radialGradient id="sunburstGrad" cx="5%" cy="95%" r="100%">
            <stop offset="0%" stopColor="#25050C" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#140612" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#07080B" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#sunburstGrad)" />
        {/* Radiating Fan Rays */}
        <g opacity="0.35">
          {Array.from({ length: 22 }).map((_, i) => {
            const angle = (i * 90) / 21;
            const rad = (angle * Math.PI) / 180;
            const x2 = originX + Math.cos(rad) * W * 1.6;
            const y2 = originY - Math.sin(rad) * H * 1.6;
            return (
              <polygon
                key={i}
                points={`${originX},${originY} ${x2},${y2} ${originX + Math.cos(((angle + 2) * Math.PI) / 180) * W * 1.6},${originY - Math.sin(((angle + 2) * Math.PI) / 180) * H * 1.6}`}
                fill={i % 2 === 0 ? "#E51E3D" : "transparent"}
                opacity={i % 2 === 0 ? "0.15" : "0"}
              />
            );
          })}
        </g>
      </svg>

      {/* 2. Coordinate Grid Axis Guides & Dots */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Y-Axis Cyan Dots */}
        <div className="absolute left-[40px] top-[48px] bottom-[36px] w-[1px] bg-zinc-700/40 flex flex-col justify-between items-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#00F0FF] -translate-x-[3.5px] shadow-[0_0_8px_#00F0FF]" />
          ))}
        </div>
        {/* X-Axis White Coordinate Dots */}
        <div className="absolute left-[40px] right-[44px] bottom-[36px] h-[1px] bg-zinc-700/40 flex justify-between items-center">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-white/90 translate-y-[3.5px] shadow-[0_0_4px_rgba(255,255,255,0.7)]" />
          ))}
        </div>
      </div>

      {/* 3. Solid Crimson Underlay Wedge with Vertical Right Edge (Visible during Flight) */}
      {isFlight && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="solidRedWedge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E51E3D" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#9E0C24" stopOpacity="0.90" />
            </linearGradient>
            <filter id="crimsonNeon" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FF1E44" floodOpacity="0.9" />
            </filter>
          </defs>
          {/* Solid Red Fill */}
          <path d={solidWedgePath} fill="url(#solidRedWedge)" />
          {/* Top Trajectory Curve Line */}
          <path d={curvePath} fill="none" stroke="#FF2B4D" strokeWidth="4" strokeLinecap="round" filter="url(#crimsonNeon)" />
          {/* Vertical Drop Boundary */}
          <line x1={planeX} y1={planeY} x2={planeX} y2={originY} stroke="#C4122E" strokeWidth="2.5" strokeDasharray="4 3" />
        </svg>
      )}

      {/* 4. Aeroplane Model */}
      {/* Before Takeoff (Idle State at Origin) */}
      {isPreparing && (
        <div className="absolute pointer-events-none z-30 transition-transform duration-300" style={{ left: `${originX}px`, top: `${originY}px`, transform: "translate(-50%, -60%)" }}>
          <svg width="76" height="48" viewBox="0 0 120 70" fill="none" className="opacity-80 drop-shadow-[0_4px_12px_rgba(229,30,61,0.5)]">
            <path d="M10 40 C22 38, 55 36, 96 35 C108 34, 114 38, 115 41 C115 44, 108 47, 96 46 C55 46, 22 45, 10 40 Z" fill="#E51E3D" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M58 35 L68 22 C71 18, 78 18, 80 22 L86 35 Z" fill="#FFFFFF" stroke="#E51E3D" strokeWidth="2" />
            <circle cx="74" cy="26" r="3.5" fill="#18181B" />
            <path d="M44 35 L76 14 C80 11, 88 12, 86 16 L68 35 Z" fill="#C4122E" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M42 43 L66 58 C70 60, 78 59, 76 55 L62 43 Z" fill="#9F0B23" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M8 40 L22 18 C24 15, 30 16, 28 21 L22 40 Z" fill="#E51E3D" stroke="#FFFFFF" strokeWidth="2" />
            <ellipse cx="115" cy="41" rx="4" ry="5.5" fill="#FFFFFF" />
            <g className="animate-spin origin-[115px_41px]" style={{ animationDuration: "140ms" }}>
              <line x1="115" y1="20" x2="115" y2="62" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      )}

      {/* In-Flight State (Climbing along Curve with Real-Time Pitch) */}
      {isFlight && (
        <div className="absolute pointer-events-none z-30" style={{ left: `${planeX}px`, top: `${planeY}px`, transform: `translate(-68%, -60%) rotate(${angleDeg}deg)` }}>
          <svg width="98" height="60" viewBox="0 0 120 70" fill="none" className="drop-shadow-[0_6px_20px_rgba(229,30,61,0.85)]">
            <path d="M10 40 C22 38, 55 36, 96 35 C108 34, 114 38, 115 41 C115 44, 108 47, 96 46 C55 46, 22 45, 10 40 Z" fill="#E51E3D" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M58 35 L68 22 C71 18, 78 18, 80 22 L86 35 Z" fill="#FFFFFF" stroke="#E51E3D" strokeWidth="2" />
            <circle cx="74" cy="26" r="3.5" fill="#18181B" />
            <path d="M44 35 L76 14 C80 11, 88 12, 86 16 L68 35 Z" fill="#C4122E" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M42 43 L66 58 C70 60, 78 59, 76 55 L62 43 Z" fill="#9F0B23" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M8 40 L22 18 C24 15, 30 16, 28 21 L22 40 Z" fill="#E51E3D" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M8 40 L18 48 C20 50, 24 49, 23 46 L18 40 Z" fill="#C4122E" stroke="#FFFFFF" strokeWidth="1.5" />
            <ellipse cx="115" cy="41" rx="4" ry="5.5" fill="#FFFFFF" />
            <g className="animate-spin origin-[115px_41px]" style={{ animationDuration: "85ms" }}>
              <line x1="115" y1="18" x2="115" y2="64" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="115" cy="41" rx="6" ry="22" fill="#FFFFFF" fillOpacity="0.4" />
            </g>
          </svg>
        </div>
      )}

      {/* Top Left Status & Telemetry Indicators */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-[#10131A]/90 border border-white/20 rounded-lg text-xs font-mono text-zinc-200 backdrop-blur-md z-30">
        <span className={`w-2.5 h-2.5 rounded-full ${isCrashed ? "bg-red-500" : isFlight ? "bg-[#00E575] animate-ping" : "bg-amber-400"}`} />
        <span className="font-bold">{isCrashed ? "FLEW AWAY" : isFlight ? "ROUND #849204" : "PREPARING FLIGHT"}</span>
      </div>

      {/* Top Right "SUPER MULTIPLIER" Badge */}
      <div className="absolute top-4 right-4 z-30">
        <div className="px-3 py-1 bg-[#E51E3D] text-white font-mono font-black text-xs tracking-wider uppercase rounded-md shadow-lg shadow-red-500/40">
          SUPER MULTIPLIER
        </div>
      </div>

      {/* Center Stage: Gigantic Multiplier or Countdown */}
      <div className="relative z-20 text-center pointer-events-none">
        {isPreparing ? (
          <div className="flex flex-col items-center">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2"> Next Flight Departure In </div>
            <div className="w-20 h-20 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin flex items-center justify-center">
              <span className="text-3xl font-mono font-black text-amber-400 -rotate-90"> {countdownSeconds}s </span>
            </div>
            <div className="mt-2 text-xs font-mono text-[#00E575] font-bold animate-pulse"> ALL CONSOLES ACCEPTING WAGERS </div>
          </div>
        ) : isCrashed ? (
          <div className="animate-bounce">
            <h2 className="text-[#FF2B4D] font-black text-5xl sm:text-7xl font-mono tracking-tight uppercase drop-shadow-[0_0_30px_rgba(255,43,77,0.9)]"> FLEW AWAY </h2>
            <div className="inline-block mt-3 px-5 py-1.5 rounded-full bg-red-950/80 border border-red-500/70 font-mono text-2xl text-white font-extrabold"> @ {multiplier.toFixed(2)}x </div>
          </div>
        ) : (
          <div>
            <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white font-mono drop-shadow-[0_8px_40px_rgba(0,0,0,0.95)]"> {multiplier.toFixed(2)}x </div>
            <div className="inline-block mt-1 px-4 py-0.5 rounded-full border border-red-500/60 bg-red-950/40 text-[11px] font-mono font-bold tracking-widest text-red-200 uppercase"> MEGA WIN CONFIRMED </div>
          </div>
        )}
      </div>
    </div>
  );
}
