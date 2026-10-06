"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import FlightDeck from "@/components/FlightDeck";
import { GamePhase, IBetSlot } from "@/types";
import { Minus, Plus, Zap, Trophy, Users, ShieldCheck } from "lucide-react";

interface LiveBet {
  _id: string;
  username: string;
  stakeAmount: number;
  status: "ACTIVE" | "CASHED_OUT" | "LOST";
  cashedOutMultiplier?: number;
  payoutAmount: number;
}

export default function GamePage() {
  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState("Pilot");
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [gameError, setGameError] = useState("");
  const [feedError, setFeedError] = useState("");
  const [multiplier, setMultiplier] = useState(1.00);
  const [phase, setPhase] = useState<GamePhase>("PREPARING");
  const [roundNumber, setRoundNumber] = useState(0);
  const [serverStartedAt, setServerStartedAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [history, setHistory] = useState<number[]>([]);

  const [console1, setConsole1] = useState<IBetSlot>({
    stake: 10, autoCashout: false, autoMultiplier: 2.0, isLocked: false, betId: null, hasCashedOut: false, cashedOutMultiplier: null, winAmount: null
  });
  const [console2, setConsole2] = useState<IBetSlot>({
    stake: 5, autoCashout: true, autoMultiplier: 2.5, isLocked: false, betId: null, hasCashedOut: false, cashedOutMultiplier: null, winAmount: null
  });

  const observedRound = useRef(0);
  const settledRound = useRef(0);

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

  useEffect(() => {
    let active = true;
    const refreshRound = async () => {
      try {
        const response = await fetch("/api/game/state", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load game round");
        if (!active) return;

        if (observedRound.current !== data.roundNumber) {
          observedRound.current = data.roundNumber;
          setRoundNumber(data.roundNumber);
          setConsole1(c => ({ ...c, isLocked: false, betId: null, hasCashedOut: false, cashedOutMultiplier: null, winAmount: null }));
          setConsole2(c => ({ ...c, isLocked: false, betId: null, hasCashedOut: false, cashedOutMultiplier: null, winAmount: null }));
        }
        setPhase(data.phase);
        setServerStartedAt(data.startedAt);
        setCountdown(Math.max(0, Math.ceil((data.startsAt - Date.now()) / 1_000)));
        if (data.phase === "CRASHED" && settledRound.current !== data.roundNumber) {
          settledRound.current = data.roundNumber;
          setMultiplier(data.crashMultiplier);
          setHistory(items => [data.crashMultiplier, ...items.slice(0, 15)]);
        }
        setGameError("");
      } catch (error) {
        if (active) setGameError(error instanceof Error ? error.message : "Unable to load game round");
      }
    };

    void refreshRound();
    const timer = window.setInterval(() => void refreshRound(), 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshBets = async () => {
      try {
        const response = await fetch("/api/game/bets", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to refresh live bets");
        if (active) {
          setLiveBets(data.bets);
          setFeedError("");
        }
      } catch (error) {
        if (active) setFeedError(error instanceof Error ? error.message : "Unable to refresh live bets");
      }
    };

    void refreshBets();
    const timer = window.setInterval(() => void refreshBets(), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const placeBet = useCallback(async (slot: 1 | 2) => {
    const betSlot = slot === 1 ? console1 : console2;
    setGameError("");
    try {
      const response = await fetch("/api/game/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stakeAmount: betSlot.stake, consoleSlot: slot })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to place bet");

      setBalance(data.newBalance);
      const update = (current: IBetSlot): IBetSlot => ({
        ...current,
        isLocked: true,
        hasCashedOut: false,
        betId: data.bet._id,
        cashedOutMultiplier: null,
        winAmount: null
      });
      if (slot === 1) setConsole1(update);
      else setConsole2(update);
    } catch (error) {
      setGameError(error instanceof Error ? error.message : "Unable to place bet");
    }
  }, [console1, console2]);

  const cashoutInProgress = useRef(new Set<string>());
  const cashOut1 = useCallback(async () => {
    const betId = console1.betId;
    if (phase !== "IN_FLIGHT" || console1.hasCashedOut || !console1.isLocked || !betId || cashoutInProgress.current.has(betId)) return;
    cashoutInProgress.current.add(betId);
    setGameError("");
    try {
      const response = await fetch("/api/game/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId, multiplier })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to cash out");
      setBalance(data.newBalance);
      setConsole1(c => ({ ...c, hasCashedOut: true, cashedOutMultiplier: data.multiplier, winAmount: data.payout }));
    } catch (error) {
      setGameError(error instanceof Error ? error.message : "Unable to cash out");
    } finally {
      cashoutInProgress.current.delete(betId);
    }
  }, [phase, console1, multiplier]);

  const cashOut2 = useCallback(async () => {
    const betId = console2.betId;
    if (phase !== "IN_FLIGHT" || console2.hasCashedOut || !console2.isLocked || !betId || cashoutInProgress.current.has(betId)) return;
    cashoutInProgress.current.add(betId);
    setGameError("");
    try {
      const response = await fetch("/api/game/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId, multiplier })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to cash out");
      setBalance(data.newBalance);
      setConsole2(c => ({ ...c, hasCashedOut: true, cashedOutMultiplier: data.multiplier, winAmount: data.payout }));
    } catch (error) {
      setGameError(error instanceof Error ? error.message : "Unable to cash out");
    } finally {
      cashoutInProgress.current.delete(betId);
    }
  }, [phase, console2, multiplier]);

  const currentGameRef = useRef({ console1, console2, cashOut1, cashOut2 });
  currentGameRef.current = { console1, console2, cashOut1, cashOut2 };

  useEffect(() => {
    if (phase !== "IN_FLIGHT" || serverStartedAt === null) return;

    let animationFrame = 0;
    const animate = () => {
      const elapsedSeconds = Math.max(0, (Date.now() - serverStartedAt) / 1_000);
      const currentMultiplier = Math.floor(Math.exp(0.07 * elapsedSeconds) * 100) / 100;
      setMultiplier(currentMultiplier);

      const { console1: currentConsole1, console2: currentConsole2, cashOut1: currentCashOut1, cashOut2: currentCashOut2 } = currentGameRef.current;
      if (currentConsole1.isLocked && !currentConsole1.hasCashedOut && currentConsole1.autoCashout && currentMultiplier >= currentConsole1.autoMultiplier) void currentCashOut1();
      if (currentConsole2.isLocked && !currentConsole2.hasCashedOut && currentConsole2.autoCashout && currentMultiplier >= currentConsole2.autoMultiplier) void currentCashOut2();

      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [phase, serverStartedAt]);

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
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-4 pb-20 md:pb-6">

        {/* Keep the live feed full-width until the viewport can fit both panels comfortably. */}
        <section className="xl:col-span-8 flex flex-col gap-4">
          <FlightDeck multiplier={multiplier} phase={phase} countdownSeconds={countdown} />

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
                      void placeBet(1);
                    }}
                    disabled={console1.isLocked || phase !== "PREPARING"}
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
                      void placeBet(2);
                    }}
                    disabled={console2.isLocked || phase !== "PREPARING"}
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

        <section className="xl:col-span-4 bg-[#10131A] border border-[#282C35] rounded-2xl p-4 flex flex-col">
          <div className="flex justify-between items-center pb-3 border-b border-[#282C35] text-xs font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Users size={14} className="text-[#00E575]" /> Active Orbiters ({liveBets.length})
            </span>
            <span className="text-[#00E575] font-bold">Round #{roundNumber} · refreshes every 3s</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-3 font-mono text-xs">
            {liveBets.map(bet => (
              <div key={bet._id} className="flex justify-between items-center gap-2 p-2 bg-[#0B0E14] rounded-lg">
                <span className="min-w-0 truncate font-bold text-zinc-200">{bet.username}</span>
                <span className="shrink-0 text-zinc-400">${bet.stakeAmount.toFixed(2)}</span>
                <span className={`shrink-0 font-bold ${bet.status === "CASHED_OUT" ? "text-[#00E575]" : bet.status === "LOST" ? "text-red-400" : "text-amber-400"}`}>
                  {bet.status === "CASHED_OUT" ? `${bet.cashedOutMultiplier?.toFixed(2)}x +$${bet.payoutAmount.toFixed(2)}` : bet.status === "LOST" ? "Crashed" : "Flying..."}
                </span>
              </div>
            ))}
            {!liveBets.length && <p className="p-2 text-zinc-500">No recent bets yet.</p>}
            {feedError && <p role="alert" className="p-2 text-red-400">{feedError}</p>}
          </div>
        </section>
      </main>
      {gameError && <p role="alert" className="mx-auto mb-20 max-w-3xl rounded-lg border border-red-900 bg-red-950/70 p-3 text-sm text-red-200">{gameError}</p>}
    </div>
  );
}
