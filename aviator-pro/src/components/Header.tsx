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
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#10131A] border-b border-[#282C35]">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-[#E51E3D] rounded-sm flex items-center justify-center font-bold text-white text-xs">
          ▲
        </div>
        <div className="font-extrabold tracking-wider text-base text-white">
          AERO<span className="text-[#E51E3D]">CRASH</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 ml-2 text-[10px] text-zinc-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E575] animate-ping" />
          3,412 PILOTS IN ORBIT
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {username && (
          <span className="hidden md:inline text-xs font-mono text-zinc-400">
            Pilot: <strong className="text-white">{username}</strong>
          </span>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0B0E14] border border-[#282C35] rounded-full">
          <span className="text-[10px] font-mono text-zinc-400">BAL · KES</span>
          <span
            className="text-xs font-mono font-bold text-[#00E575]"
            title={kesPerUsd === null ? "KES display unavailable: configure WITHDRAWAL_KES_PER_USD" : undefined}
          >
            {formattedBalance === null
              ? "KSh unavailable"
              : formattedBalance}
          </span>
          <Link
            href="/cashier"
            className="w-5 h-5 rounded-full bg-[#00E575] text-[#0B0E14] flex items-center justify-center hover:opacity-90 font-bold ml-1"
            title="Deposit M-PESA / Airtel / Card"
          >
            <Plus size={13} strokeWidth={3} />
          </Link>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 text-zinc-400 hover:text-white rounded bg-[#191C22]"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
