"use client";
import React, { useEffect, useRef } from "react";
import { GamePhase } from "@/types";

interface FlightDeckProps {
  multiplier: number;
  phase: GamePhase;
  countdownSeconds: number;
}

export default function FlightDeck({ multiplier, phase, countdownSeconds }: FlightDeckProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/aviator-engine.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
  }, []);

  // Play/Pause based on game phase
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (phase === "IN_FLIGHT") {
      audioRef.current.play().catch((e) => console.log("Audio play blocked:", e));
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [phase]);

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] bg-[#10131A] border border-[#232733] rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#282C35 1px, transparent 1px), linear-gradient(90deg, #282C35 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      
      {/* Flight Path Curve */}
      {phase === "IN_FLIGHT" && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0 100 Q 50 100 100 0" fill="none" stroke="#E51E3D" strokeWidth="0.5" strokeDasharray="2,2" />
          <path d="M 0 100 Q 50 100 100 0" fill="url(#grad1)" opacity="0.2" />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E51E3D" stopOpacity="0" />
              <stop offset="100%" stopColor="#E51E3D" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* Center Multiplier Display */}
      <div className="relative z-10 text-center">
        {phase === "PREPARING" ? (
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Next Round In</div>
            <div className="text-6xl sm:text-7xl font-black font-mono text-white animate-pulse">
              {countdownSeconds}s
            </div>
          </div>
        ) : phase === "CRASHED" ? (
          <div>
            <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-2">Flew Away!</div>
            <div className="text-6xl sm:text-7xl font-black font-mono text-[#E51E3D]">
              {multiplier.toFixed(2)}x
            </div>
          </div>
        ) : (
          <div className="animate-bounce-slow">
            <div className="text-6xl sm:text-8xl font-black font-mono text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {multiplier.toFixed(2)}x
            </div>
          </div>
        )}
      </div>

      {/* Airplane Icon */}
      {phase === "IN_FLIGHT" && (
        <div className="absolute top-10 right-10 animate-fly">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#E51E3D">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
      )}
    </div>
  );
}
