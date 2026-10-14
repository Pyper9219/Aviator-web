"use client";

import React from "react";
import { GamePhase } from "@/types";

interface FlightDeckProps {
  multiplier: number;
  phase: GamePhase;
  countdownSeconds: number;
  roundNumber: number;
}

const CHART_WIDTH = 1_000;
const CHART_HEIGHT = 600;
const ORIGIN_X = 64;
const ORIGIN_Y = 526;

export default function FlightDeck({
  multiplier,
  phase,
  countdownSeconds,
  roundNumber,
}: FlightDeckProps) {
  const isCrashed = phase === "CRASHED";
  const isPreparing = phase === "PREPARING";
  const safeMultiplier = Math.max(1, multiplier);
  const progress = Math.min(0.97, 1 - Math.exp(-Math.log(safeMultiplier) / 1.6));
  const planeX = ORIGIN_X + progress * 850;
  const planeY = ORIGIN_Y - Math.pow(progress, 1.25) * 430;
  const controlX = ORIGIN_X + (planeX - ORIGIN_X) * 0.55;
  const angle = (Math.atan2(planeY - ORIGIN_Y, planeX - controlX) * 180) / Math.PI;
  const curvePath = `M ${ORIGIN_X} ${ORIGIN_Y} Q ${controlX} ${ORIGIN_Y} ${planeX} ${planeY}`;
  const wedgePath = `${curvePath} L ${planeX} ${ORIGIN_Y} Z`;

  return (
    <div
      className="relative isolate h-[min(72vw,460px)] min-h-[280px] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#101216] shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:min-h-[340px]"
      role="img"
      aria-label={`Aviator flight chart, round ${roundNumber}, ${isPreparing ? `starting in ${countdownSeconds} seconds` : isCrashed ? `crashed at ${multiplier.toFixed(2)} times` : `currently at ${multiplier.toFixed(2)} times`}`}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="flight-sunburst" cx="6.4%" cy="87.7%" r="100%">
            <stop offset="0%" stopColor="#641222" stopOpacity="0.52" />
            <stop offset="62%" stopColor="#31101a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#101216" stopOpacity="0" />
          </radialGradient>
          <pattern id="flight-grid" width="88" height="72" patternUnits="userSpaceOnUse">
            <path d="M 88 0 L 0 0 0 72" fill="none" stroke="#a8b2c2" strokeOpacity="0.11" strokeWidth="1" />
          </pattern>
          <linearGradient id="flight-wedge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3294a" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#a20d29" stopOpacity="0.93" />
          </linearGradient>
          <filter id="flight-line-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="propeller-blur">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        <rect width={CHART_WIDTH} height={CHART_HEIGHT} fill="#101216" />
        <rect width={CHART_WIDTH} height={CHART_HEIGHT} fill="url(#flight-sunburst)" />

        <g opacity="0.42">
          {Array.from({ length: 24 }, (_, index) => {
            const angle = (-87 + (index * 84) / 23) * (Math.PI / 180);
            const nextAngle = angle + 0.035;
            const rayLength = CHART_WIDTH * 1.8;
            const endX = ORIGIN_X + Math.cos(angle) * rayLength;
            const endY = ORIGIN_Y + Math.sin(angle) * rayLength;
            const nextX = ORIGIN_X + Math.cos(nextAngle) * rayLength;
            const nextY = ORIGIN_Y + Math.sin(nextAngle) * rayLength;

            return index % 2 === 0 ? (
              <polygon
                key={index}
                points={`${ORIGIN_X},${ORIGIN_Y} ${endX},${endY} ${nextX},${nextY}`}
                fill="#e51e3d"
                fillOpacity="0.16"
              />
            ) : null;
          })}
        </g>

        <rect width={CHART_WIDTH} height={CHART_HEIGHT} fill="url(#flight-grid)" />
        <line x1={ORIGIN_X} y1="58" x2={ORIGIN_X} y2={ORIGIN_Y} stroke="#8b929e" strokeOpacity="0.32" />
        <line x1={ORIGIN_X} y1={ORIGIN_Y} x2="958" y2={ORIGIN_Y} stroke="#8b929e" strokeOpacity="0.32" />

        {Array.from({ length: 8 }, (_, index) => (
          <circle
            key={`y-${index}`}
            cx={ORIGIN_X}
            cy={82 + index * 62}
            r="4"
            fill="#00e5ff"
            filter="url(#flight-line-glow)"
          />
        ))}
        {Array.from({ length: 12 }, (_, index) => (
          <circle
            key={`x-${index}`}
            cx={ORIGIN_X + index * 80}
            cy={ORIGIN_Y}
            r="3.5"
            fill="#f4f6fa"
            fillOpacity="0.9"
          />
        ))}

        {!isPreparing && (
          <>
            <path d={wedgePath} fill="url(#flight-wedge)" />
            <path
              d={curvePath}
              fill="none"
              stroke={isCrashed ? "#ff526a" : "#ff2b4d"}
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#flight-line-glow)"
            />
            <line
              x1={planeX}
              y1={planeY}
              x2={planeX}
              y2={ORIGIN_Y}
              stroke="#ff526a"
              strokeOpacity="0.58"
              strokeWidth="2"
              strokeDasharray="6 7"
            />
          </>
        )}

        {!isPreparing && (
          <g transform={`translate(${planeX - 60} ${planeY - 35}) rotate(${angle} 60 35)`}>
            <g opacity={isCrashed ? "0.72" : "1"}>
              <path
                d="M8 37 C28 33 70 32 105 33 C114 33 119 36 119 39 C119 42 114 45 105 45 C70 46 28 42 8 37Z"
                fill="#e51e3d"
                stroke="#fff"
                strokeWidth="2.4"
              />
              <path d="M47 34 76 13 Q83 10 88 14 L70 35Z" fill="#b90f2c" stroke="#fff" strokeWidth="2" />
              <path d="m48 42 24 14q8 3 11-1L69 42Z" fill="#a20d29" stroke="#fff" strokeWidth="2" />
              <path d="m13 37 13-19q5-4 7 1l-8 19Z" fill="#e51e3d" stroke="#fff" strokeWidth="1.8" />
              <path d="m57 34 9-14q4-5 9-2l10 16Z" fill="#fff" stroke="#b90f2c" strokeWidth="2" />
              <circle cx="75" cy="25" r="3.3" fill="#15171b" />
              <ellipse cx="118" cy="39" rx="7" ry="23" fill="#fff" fillOpacity="0.3" filter="url(#propeller-blur)" />
              <g
                className={isCrashed ? undefined : "animate-spin"}
                style={{
                  transformBox: "view-box",
                  transformOrigin: "118px 39px",
                  animationDuration: "85ms",
                }}
              >
                <line x1="118" y1="16" x2="118" y2="62" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                <line x1="108" y1="39" x2="128" y2="39" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
              </g>
            </g>
          </g>
        )}
      </svg>

      <div className="absolute left-2 top-2 z-10 flex max-w-[62%] items-center gap-1.5 rounded-lg border border-white/15 bg-[#111318]/90 px-2 py-1.5 font-mono text-[9px] text-zinc-200 backdrop-blur sm:left-4 sm:top-4 sm:gap-2 sm:px-2.5 sm:text-xs">
        <span className={`h-2 w-2 shrink-0 rounded-full ${isCrashed ? "bg-red-500" : isPreparing ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
        <span className="truncate">{isCrashed ? "FLEW AWAY" : isPreparing ? "PREPARING" : "IN FLIGHT"}</span>
        <span className="hidden shrink-0 text-zinc-500 sm:inline">·</span>
        <span className="hidden shrink-0 text-zinc-400 sm:inline">ROUND #{roundNumber}</span>
      </div>

      <div className="absolute right-2 top-2 z-10 max-w-[34%] truncate rounded-lg border border-white/15 bg-[#111318]/90 px-2 py-1.5 text-center font-mono text-[9px] font-bold tracking-wide text-zinc-300 backdrop-blur sm:right-4 sm:top-4 sm:max-w-none sm:px-2.5 sm:text-xs">
        {isPreparing ? "BETS OPEN" : isCrashed ? "ROUND ENDED" : "LIVE"}
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center pt-4 text-center">
        {isPreparing ? (
          <div>
            <div className="font-mono text-5xl font-black tabular-nums text-amber-300 drop-shadow-[0_0_24px_rgba(251,191,36,0.36)] sm:text-6xl">
              {countdownSeconds}s
            </div>
            <p className="mt-2 font-mono text-[10px] tracking-[0.22em] text-amber-100/70 sm:text-xs">
              NEXT FLIGHT DEPARTURE
            </p>
          </div>
        ) : isCrashed ? (
          <div>
            <div className="font-mono text-4xl font-black uppercase tracking-[0.08em] text-red-400 drop-shadow-[0_0_24px_rgba(229,30,61,0.4)] sm:text-6xl">
              FLEW AWAY
            </div>
            <p className="mt-2 font-mono text-lg text-zinc-300 sm:text-2xl">@ {multiplier.toFixed(2)}x</p>
          </div>
        ) : (
          <div>
            <div className="font-mono text-6xl font-black tabular-nums tracking-tight text-white drop-shadow-[0_0_28px_rgba(229,30,61,0.52)] sm:text-7xl lg:text-8xl">
              {multiplier.toFixed(2)}x
            </div>
            <p className="mt-2 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.16em] text-zinc-300/80 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-[#ff2b4d] animate-pulse" />
              MULTIPLIER CLIMBING
            </p>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-between font-mono text-[9px] tracking-wider text-zinc-400/75 sm:bottom-4 sm:left-4 sm:right-4 sm:text-[10px]">
        <span>ORBIT: {isCrashed ? "TERMINATED" : "ACTIVE"}</span>
        <span>FLIGHT COEFFICIENT</span>
      </div>
    </div>
  );
}
