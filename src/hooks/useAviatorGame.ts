"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { GamePhase, IBetSlot, IOrbiterPlayer } from "@/types";
import { soundEngine } from "@/lib/audio/soundEngine";

const KENYAN_PILOTS = [
  "Kamau_KE", "Kipchoge_99", "NairobiAce", "Pilot_Wanjiku", "M-PesaGlider",
  "SafariAce", "Onyango_Gold", "JumaCash", "EastAir_Pro", "VictorFlyer",
  "Amina_Mombasa", "Kibet_Speed", "Mwangi_Trader", "NaivashaAce", "Turbo_Kenya",
  "Sharon_Flyer", "Mutua_Express", "Otieno_Pilot", "EldoretStriker", "NakuruJet"
];
const STAKE_PRESETS_KSH = [50, 100, 200, 500, 1000, 2500, 5000];

export function useAviatorGame() {
  const [balance, setBalance] = useState<number>(2500.00);
  const [username, setUsername] = useState<string>("Pilot");
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [phase, setPhase] = useState<GamePhase>("PREPARING");
  const [countdown, setCountdown] = useState<number>(5);
  const [roundNumber, setRoundNumber] = useState<number>(849204);
  const [history, setHistory] = useState<number[]>([1.22, 2.14, 11.39, 1.04, 54.87, 3.82, 1.45, 18.20]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [liveBets, setLiveBets] = useState<IOrbiterPlayer[]>([
    { id: "init_1", username: "Kamau_KE", stake: 500, mult: 2.15, profit: 575, status: "CASHED_OUT", timestamp: Date.now() - 3500 },
    { id: "init_2", username: "Pilot_Wanjiku", stake: 1000, mult: null, profit: 0, status: "IN_FLIGHT", timestamp: Date.now() - 2800 },
    { id: "init_3", username: "Kipchoge_99", stake: 200, mult: 4.80, profit: 760, status: "CASHED_OUT", timestamp: Date.now() - 2100 },
    { id: "init_4", username: "M-PesaGlider", stake: 100, mult: null, profit: 0, status: "IN_FLIGHT", timestamp: Date.now() - 1400 },
  ]);

  const [console1, setConsole1] = useState<IBetSlot>({
    stake: 200, autoCashout: false, autoMultiplier: 2.00, isLocked: false, betId: null, hasCashedOut: false, cashedOutMultiplier: null, winAmount: null,
  });
  const [console2, setConsole2] = useState<IBetSlot>({
    stake: 100, autoCashout: true, autoMultiplier: 12338.75, isLocked: true, betId: "b2_locked", hasCashedOut: true, cashedOutMultiplier: 12338.75, winAmount: 1233875,
  });

  const toggleSound = useCallback(() => {
    if (soundEngine) {
      const muted = soundEngine.toggleMute();
      setIsMuted(muted);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setBalance(data.user.balanceKSH);
        setUsername(data.user.username);
      }
    } catch (e) {}
  }, []);

  useEffect(() => { refreshUserData(); }, [refreshUserData]);

  const cashOutConsole1 = useCallback(async () => {
    if (phase !== "IN_FLIGHT" || console1.hasCashedOut || !console1.isLocked) return;
    const currentMult = multiplier;
    const payout = Math.round(console1.stake * currentMult);
    const profit = Math.round(payout - console1.stake);
    if (soundEngine) soundEngine.playCashoutChime();
    setBalance(b => b + payout);
    setConsole1(c => ({ ...c, hasCashedOut: true, cashedOutMultiplier: currentMult, winAmount: payout }));
    setLiveBets(prev => [{ id: `user_co_${Date.now()}`, username: `${username} (You)`, stake: console1.stake, mult: currentMult, profit, status: "CASHED_OUT", timestamp: Date.now() }, ...prev]);
    fetch("/api/game/cashout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payoutAmount: payout }) }).catch(() => {});
  }, [phase, console1, multiplier, username]);

  const placeBet1 = useCallback(async () => {
    if (balance < console1.stake) { alert("Insufficient KSh balance! Please top up via M-PESA."); return; }
    setBalance(b => b - console1.stake);
    setConsole1(c => ({ ...c, isLocked: true, hasCashedOut: false, cashedOutMultiplier: null, winAmount: null, betId: `bet_${Date.now()}` }));
    setLiveBets(prev => [{ id: `user_b_${Date.now()}`, username: `${username} (You)`, stake: console1.stake, mult: null, profit: 0, status: "IN_FLIGHT", timestamp: Date.now() }, ...prev]);
    fetch("/api/game/bet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stakeAmount: console1.stake, consoleSlot: 1 }) }).catch(() => {});
  }, [balance, console1.stake, username]);

  const crashTargetRef = useRef<number>(3.85);
  const flightStartTimeRef = useRef<number>(0);

  useEffect(() => {
    let animId: number;
    let countdownTimer: NodeJS.Timeout;
    if (phase === "PREPARING") {
      setMultiplier(1.00);
      let count = 5;
      setCountdown(count);
      if (soundEngine) soundEngine.startIdleEngine();
      countdownTimer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countdownTimer);
          crashTargetRef.current = parseFloat((1.15 + Math.random() * 12.0).toFixed(2));
          flightStartTimeRef.current = Date.now();
          setPhase("IN_FLIGHT");
          if (soundEngine) soundEngine.startFlightEngine();
        }
      }, 1000);
    } else if (phase === "IN_FLIGHT") {
      const flightTick = () => {
        const elapsedSec = (Date.now() - flightStartTimeRef.current) / 1000;
        const currentM = parseFloat((1.00 * Math.pow(Math.E, 0.082 * elapsedSec)).toFixed(2));
        if (soundEngine) soundEngine.updateEnginePitch(currentM);
        if (console1.isLocked && !console1.hasCashedOut && console1.autoCashout && currentM >= console1.autoMultiplier) {
          cashOutConsole1();
        }
        if (currentM >= crashTargetRef.current) {
          setMultiplier(crashTargetRef.current);
          setPhase("CRASHED");
          setHistory(h => [crashTargetRef.current, ...h.slice(0, 15)]);
          if (soundEngine) soundEngine.playCrashSound();
          setLiveBets(prev => prev.map(b => (b.status === "IN_FLIGHT" ? { ...b, status: "CRASHED" } : b)));
          setTimeout(() => {
            setRoundNumber(r => r + 1);
            setConsole1(c => ({ ...c, isLocked: false, hasCashedOut: false, betId: null }));
            setPhase("PREPARING");
          }, 3500);
        } else {
          setMultiplier(currentM);
          animId = requestAnimationFrame(flightTick);
        }
      };
      animId = requestAnimationFrame(flightTick);
    }
    return () => { cancelAnimationFrame(animId); clearInterval(countdownTimer); };
  }, [phase, console1, cashOutConsole1]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const scheduleNextDemoPilot = () => {
      const delay = Math.floor(1500 + Math.random() * 1700);
      timeoutId = setTimeout(() => {
        const randomName = KENYAN_PILOTS[Math.floor(Math.random() * KENYAN_PILOTS.length)];
        const randomStake = STAKE_PRESETS_KSH[Math.floor(Math.random() * STAKE_PRESETS_KSH.length)];
        const isCashout = phase === "IN_FLIGHT" && Math.random() > 0.40;
        const coMult = isCashout ? parseFloat((1.12 + Math.random() * (multiplier > 1.2 ? multiplier : 2.5)).toFixed(2)) : null;
        const profit = coMult ? Math.round(randomStake * (coMult - 1)) : 0;
        const newDemoPlayer: IOrbiterPlayer = {
          id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          username: randomName, stake: randomStake, mult: coMult, profit,
          status: isCashout ? "CASHED_OUT" : "IN_FLIGHT", timestamp: Date.now()
        };
        setLiveBets(prev => [newDemoPlayer, ...prev]);
        scheduleNextDemoPilot();
      }, delay);
    };
    scheduleNextDemoPilot();
    return () => clearTimeout(timeoutId);
  }, [phase, multiplier]);

  return { balance, username, phase, multiplier, countdown, roundNumber, history, liveBets, console1, setConsole1, console2, setConsole2, cashOutConsole1, placeBet1, isMuted, toggleSound };
}
