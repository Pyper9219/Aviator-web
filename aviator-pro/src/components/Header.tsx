"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShieldCheck, LogOut, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatKESBalance } from "@/lib/currency";

export default function Header({ balance, username }: { balance: number; username?: string }) {
  const router = useRouter();
  const [kesPerUsd, setKesPerUsd] = useState<number | null>(null);
  const formattedBalance = formatKESBalance(balance, kesPerUsd);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load KES exchange rate");
        const rate = data.rates?.KES;
        if (active) {
          setKesPerUsd(typeof rate === "number" && Number.isFinite(rate) && rate > 0 ? rate : null);
        }
      })
      .catch((error) => {
        console.error("Unable to load balance display currency", error);
        if (active) setKesPerUsd(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-[#282C35] bg-[#10131A] px-2.5 py-2.5 sm:px-4 sm:py-3">
      <Link href="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#E51E3D] text-xs font-bold text-white">
          ▲
        </div>
        <div className="shrink-0 text-sm font-extrabold tracking-wide text-white sm:text-base sm:tracking-wider">
          AERO<span className="text-[#E51E3D]">CRASH</span>
        </div>
        <div className="ml-1 hidden items-center gap-1 text-[10px] font-mono text-zinc-400 sm:flex sm:ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E575] animate-ping" />
          3,412 PILOTS IN ORBIT
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {username && (
          <span className="hidden max-w-36 truncate text-xs font-mono text-zinc-400 lg:inline">
            Pilot: <strong className="text-white">{username}</strong>
          </span>
        )}

        <div className="flex min-w-0 items-center gap-1 rounded-full border border-[#282C35] bg-[#0B0E14] px-2 py-1 sm:gap-1.5 sm:px-3">
          <span className="hidden text-[10px] font-mono text-zinc-400 sm:inline">BAL · KES</span>
          <span
            className="max-w-[34vw] truncate text-[11px] font-mono font-bold text-[#00E575] sm:max-w-none sm:text-xs"
            title={kesPerUsd === null ? "KES display unavailable: configure WITHDRAWAL_KES_PER_USD" : undefined}
          >
            {formattedBalance === null
              ? "KSh unavailable"
              : formattedBalance}
          </span>
          <Link
            href="/cashier"
            className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00E575] font-bold text-[#0B0E14] hover:opacity-90 sm:ml-1"
            title="Deposit M-PESA / Airtel / Card"
            aria-label="Deposit funds"
          >
            <Plus size={13} strokeWidth={3} />
          </Link>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign out"
          className="shrink-0 rounded bg-[#191C22] p-1.5 text-zinc-400 hover:text-white"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
