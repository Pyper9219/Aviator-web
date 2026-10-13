"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import DemoOrbiters from "@/components/DemoOrbiters";
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
  createdAt: string;
}

export default function GamePage() {
  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState("Pilot");
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [activeOrbiterCount, setActiveOrbiterCount] = useState(0);
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
  const feedCursor = useRef<{ createdAt: string; id: string } | null>(null);
  const feedRequestInProgress = useRef(false);

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
      if (feedRequestInProgress.current) return;
      feedRequestInProgress.current = true;

      try {
        const cursor = feedCursor.current;
        const feedUrl = new URL("/api/game/bets", window.location.origin);
        if (cursor) {
          feedUrl.searchParams.set("afterCreatedAt", cursor.createdAt);
          feedUrl.searchParams.set("afterId", cursor.id);
        }

        const response = await fetch(`${feedUrl.pathname}${feedUrl.search}`, { cache: "no-store" });
        const data: {
          bets: LiveBet[];
          newBets: LiveBet[];
          activeCount: number;
          error?: string;
        } = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to refresh live bets");
        if (active) {
          const receivedBets = [...data.bets, ...data.newBets];
          const receivedById = new Map(receivedBets.map((bet) => [bet._id, bet]));

          setLiveBets((previous) => {
            const previousIds = new Set(previous.map((bet) => bet._id));
            const newlyReceived = Array.from(receivedById.values())
              .filter((bet) => !previousIds.has(bet._id))
              .sort(
                (a, b) =>
                  Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
                  b._id.localeCompare(a._id)
              );
            const updatedHistory = previous.map((bet) => receivedById.get(bet._id) ?? bet);

            return [...newlyReceived, ...updatedHistory];
          });

          const lastNewBet = data.newBets.at(-1);
          if (lastNewBet) {
            feedCursor.current = { createdAt: lastNewBet.createdAt, id: lastNewBet._id };
          } else if (!cursor) {
            const oldestInitialBet = data.bets.at(-1);
            if (oldestInitialBet) {
              feedCursor.current = {
                createdAt: oldestInitialBet.createdAt,
                id: oldestInitialBet._id
              };
            }
          }

          setActiveOrbiterCount(data.activeCount);
          setFeedError("");
        }
      } catch (error) {
        if (active) setFeedError(error instanceof Error ? error.message : "Unable to refresh live bets");
      } finally {
        feedRequestInProgress.current = false;
      }
    };

    void refreshBets();
    const timer = window.setInterval(() => void refreshBets(), 1000);
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
          <FlightDeck
            multiplier={multiplier}
            phase={phase}
            countdownSeconds={countdown}
            roundNumber={roundNumber}
          />

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

        <div className="xl:col-span-4 flex flex-col gap-4">
          <section
            aria-label="Real-money live pilot activity"
            className="flex h-[560px] flex-col rounded-2xl border border-[#282C35] bg-[#10131A] p-4"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#282C35] pb-3 font-mono text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Users size={14} className="text-[#00E575]" /> Active Orbiters ({activeOrbiterCount})
              </span>
              <span className="flex items-center gap-1.5 font-bold text-[#00E575]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00E575] animate-pulse" />
                REAL BETS · LIVE
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 font-mono text-xs">
              <div className="space-y-2">
                {liveBets.map((bet) => {
                  const isCashedOut = bet.status === "CASHED_OUT";
                  const isLost = bet.status === "LOST";
                  const profit = bet.payoutAmount - bet.stakeAmount;

                  return (
                    <div
                      key={bet._id}
                      className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-[#0B0E14] p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isCashedOut
                              ? "bg-emerald-400"
                              : isLost
                                ? "bg-red-500"
                                : "bg-amber-400 animate-pulse"
                          }`}
                        />
                        <span className="truncate font-bold text-zinc-200">{bet.username}</span>
                      </div>
                      <span className="shrink-0 text-zinc-400">${bet.stakeAmount.toFixed(2)}</span>
                      <span
                        className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${
                          isCashedOut
                            ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : isLost
                              ? "border border-red-400/20 bg-red-400/10 text-red-300"
                              : "border border-amber-400/20 bg-amber-400/10 text-amber-300"
                        }`}
                        title={isCashedOut ? `Total payout: $${bet.payoutAmount.toFixed(2)}` : undefined}
                      >
                        {isCashedOut
                          ? `${bet.cashedOutMultiplier?.toFixed(2)}x · ${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}`
                          : isLost
                            ? "FLEW AWAY"
                            : "IN FLIGHT"}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!liveBets.length && <p className="p-2 text-zinc-500">No real bets yet.</p>}
              {feedError && <p role="alert" className="p-2 text-red-400">{feedError}</p>}
            </div>
          </section>
          <DemoOrbiters />
        </div>
      </main>
      {gameError && <p role="alert" className="mx-auto mb-20 max-w-3xl rounded-lg border border-red-900 bg-red-950/70 p-3 text-sm text-red-200">{gameError}</p>}
    </div>
  );
}
