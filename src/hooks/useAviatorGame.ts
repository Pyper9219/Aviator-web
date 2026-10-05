'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GamePhase, IBetSlot } from '@/types';

export function useAviatorGame() {
  const [balance, setBalance] = useState<number>(4850.50);
  const [phase, setPhase] = useState<GamePhase>('IN_FLIGHT');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [history, setHistory] = useState<number[]>([4.82, 1.24, 3.15, 14.80, 1.02, 2.64, 5.12, 1.14, 2.45, 18.90]);
  const [crashPoint, setCrashPoint] = useState<number>(5.12);
  const [roundNumber, setRoundNumber] = useState<number>(948201);
  const [recentWin, setRecentWin] = useState<{ multiplier: number; profit: number; stake: number } | null>(null);

  const [console1, setConsole1] = useState<IBetSlot>({
    stake: 25.00,
    autoCashout: false,
    autoMultiplier: 5.00,
    isLocked: true,
    betId: 'bet_init_1',
    hasCashedOut: false,
    cashedOutMultiplier: null,
    winAmount: null,
  });

  const [console2, setConsole2] = useState<IBetSlot>({
    stake: 10.00,
    autoCashout: true,
    autoMultiplier: 2.00,
    isLocked: false,
    betId: null,
    hasCashedOut: false,
    cashedOutMultiplier: null,
    winAmount: null,
  });

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetch('/api/cashier/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.balanceUSD) setBalance(data.user.balanceUSD);
      })
      .catch(() => {});
  }, []);

  const cashOutConsole1 = useCallback(async () => {
    if (phase !== 'IN_FLIGHT' || console1.hasCashedOut || !console1.isLocked) return;

    const currentMult = multiplier;
    const payout = parseFloat((console1.stake * currentMult).toFixed(2));
    const profit = parseFloat((payout - console1.stake).toFixed(2));

    setBalance((prev) => prev + payout);
    setConsole1((prev) => ({
      ...prev,
      hasCashedOut: true,
      cashedOutMultiplier: currentMult,
      winAmount: payout,
    }));
    setRecentWin({ multiplier: currentMult, profit, stake: console1.stake });

    try {
      await fetch('/api/game/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betId: console1.betId || 'mock_1',
          multiplier: currentMult,
          stakeAmount: console1.stake,
        }),
      });
    } catch (e) {}
  }, [phase, console1, multiplier]);

  const cashOutConsole2 = useCallback(async () => {
    if (phase !== 'IN_FLIGHT' || console2.hasCashedOut || !console2.isLocked) return;

    const currentMult = multiplier;
    const payout = parseFloat((console2.stake * currentMult).toFixed(2));
    const profit = parseFloat((payout - console2.stake).toFixed(2));

    setBalance((prev) => prev + payout);
    setConsole2((prev) => ({
      ...prev,
      hasCashedOut: true,
      cashedOutMultiplier: currentMult,
      winAmount: payout,
    }));
    setRecentWin({ multiplier: currentMult, profit, stake: console2.stake });

    try {
      await fetch('/api/game/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betId: console2.betId || 'mock_2',
          multiplier: currentMult,
          stakeAmount: console2.stake,
        }),
      });
    } catch (e) {}
  }, [phase, console2, multiplier]);

  const placeBet1 = useCallback(async () => {
    if (balance < console1.stake) return alert('Insufficient funds! Please deposit.');
    setBalance((prev) => prev - console1.stake);
    setConsole1((prev) => ({
      ...prev,
      isLocked: true,
      hasCashedOut: false,
      cashedOutMultiplier: null,
      winAmount: null,
      betId: `bet_${Date.now()}_1`,
    }));

    fetch('/api/game/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stakeAmount: console1.stake, consoleSlot: 1 }),
    }).catch(() => {});
  }, [balance, console1.stake]);

  const placeBet2 = useCallback(async () => {
    if (balance < console2.stake) return alert('Insufficient funds! Please deposit.');
    setBalance((prev) => prev - console2.stake);
    setConsole2((prev) => ({
      ...prev,
      isLocked: true,
      hasCashedOut: false,
      cashedOutMultiplier: null,
      winAmount: null,
      betId: `bet_${Date.now()}_2`,
    }));

    fetch('/api/game/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stakeAmount: console2.stake, consoleSlot: 2 }),
    }).catch(() => {});
  }, [balance, console2.stake]);

  useEffect(() => {
    if (phase === 'IN_FLIGHT') {
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const currentM = parseFloat((1.00 * Math.pow(Math.E, 0.07 * elapsed)).toFixed(2));

        if (console1.isLocked && !console1.hasCashedOut && console1.autoCashout && currentM >= console1.autoMultiplier) {
          cashOutConsole1();
        }
        if (console2.isLocked && !console2.hasCashedOut && console2.autoCashout && currentM >= console2.autoMultiplier) {
          cashOutConsole2();
        }

        if (currentM >= crashPoint) {
          setMultiplier(crashPoint);
          setPhase('CRASHED');
          setHistory((prev) => [crashPoint, ...prev.slice(0, 19)]);
          clearInterval(timerRef.current);

          setTimeout(() => {
            setRoundNumber((r) => r + 1);
            setMultiplier(1.00);
            const randomCrash = parseFloat((1.10 + Math.random() * 8.5).toFixed(2));
            setCrashPoint(randomCrash);
            setPhase('IN_FLIGHT');
            setConsole1((c) => ({ ...c, hasCashedOut: false, cashedOutMultiplier: null, winAmount: null }));
            setConsole2((c) => ({ ...c, hasCashedOut: false, cashedOutMultiplier: null, winAmount: null }));
          }, 3500);
        } else {
          setMultiplier(currentM);
        }
      }, 50);
    }

    return () => clearInterval(timerRef.current);
  }, [phase, crashPoint, console1, console2, cashOutConsole1, cashOutConsole2]);

  return {
    balance,
    phase,
    multiplier,
    history,
    roundNumber,
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
  };
}
