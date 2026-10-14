"use client";

import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";

type DemoStatus = "IN_FLIGHT" | "CASHED_OUT" | "FLEW AWAY";

interface DemoOrbiter {
  id: number;
  username: string;
  credits: number;
  status: DemoStatus;
  multiplier: number | null;
  profit: number;
}

const DEMO_CREDITS = [25, 50, 100, 250, 500, 1_000];

function createDemoOrbiter(id: number): DemoOrbiter {
  const credits = DEMO_CREDITS[Math.floor(Math.random() * DEMO_CREDITS.length)];
  const result = Math.random();

  if (result < 0.48) {
    const multiplier = Number((1.2 + Math.random() * 4.8).toFixed(2));
    return {
      id,
      username: `DemoPilot_${String(id).padStart(5, "0")}`,
      credits,
      status: "CASHED_OUT",
      multiplier,
      profit: Math.round(credits * (multiplier - 1)),
    };
  }

  if (result < 0.68) {
    return {
      id,
      username: `DemoPilot_${String(id).padStart(5, "0")}`,
      credits,
      status: "FLEW AWAY",
      multiplier: null,
      profit: 0,
    };
  }

  return {
    id,
    username: `DemoPilot_${String(id).padStart(5, "0")}`,
    credits,
    status: "IN_FLIGHT",
    multiplier: null,
    profit: 0,
  };
}

export default function DemoOrbiters() {
  const [orbiters, setOrbiters] = useState<DemoOrbiter[]>([]);
  const nextId = useRef(1);
  const activeCount = orbiters.reduce(
    (count, orbiter) => count + Number(orbiter.status === "IN_FLIGHT"),
    0
  );

  useEffect(() => {
    const addDemoOrbiter = () => {
      const orbiter = createDemoOrbiter(nextId.current);
      nextId.current += 1;
      setOrbiters((current) => [orbiter, ...current]);
    };

    addDemoOrbiter();
    const timer = window.setInterval(addDemoOrbiter, 850);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Demo-only simulated pilot activity"
      className="flex h-[360px] flex-col rounded-2xl border border-amber-400/25 bg-[#17140e] p-4"
    >
      <div className="flex flex-col items-start gap-2 border-b border-amber-400/15 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono text-amber-100 sm:text-xs">
          <Users size={14} className="text-amber-300" />
          <span>DEMO ORBITERS ({activeCount} IN FLIGHT)</span>
        </div>
        <span className="rounded border border-amber-300/30 bg-amber-300/10 px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-amber-200">
          SIMULATED · NO WAGERS
        </span>
      </div>

      <p className="pt-2 font-mono text-[10px] leading-relaxed text-amber-100/60">
        Practice activity only. These generated pilots and demo credits are not real players or bets.
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3 font-mono text-xs">
        <div className="space-y-2">
          {orbiters.map((orbiter) => {
            const cashedOut = orbiter.status === "CASHED_OUT";
            const flewAway = orbiter.status === "FLEW AWAY";

            return (
              <div
                key={orbiter.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1 rounded-lg border border-amber-100/[0.06] bg-[#100f0c] p-2.5 sm:flex sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      cashedOut
                        ? "bg-emerald-400"
                        : flewAway
                          ? "bg-red-400"
                          : "bg-amber-300 animate-pulse"
                    }`}
                  />
                  <span className="truncate font-bold text-zinc-200">{orbiter.username}</span>
                </div>
                <span className="shrink-0 text-zinc-400">{orbiter.credits} cr</span>
                <span
                  className={`col-span-2 max-w-full justify-self-end rounded-md border px-2 py-1 text-right text-[10px] font-bold sm:col-span-1 sm:shrink-0 sm:justify-self-auto sm:whitespace-nowrap ${
                    cashedOut
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : flewAway
                        ? "border-red-400/20 bg-red-400/10 text-red-300"
                        : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {cashedOut
                    ? `${orbiter.multiplier?.toFixed(2)}x · +${orbiter.profit} cr`
                    : orbiter.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
