"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Volume2, VolumeX, LogOut, ShieldCheck, ShieldAlert } from "lucide-react";

interface HeaderProps {
  balance: number;
  username?: string;
  role?: "PILOT" | "ADMIN";
  isMuted?: boolean;
  onToggleSound?: () => void;
}

export default function Header({ balance, username = "Pilot", role = "PILOT", isMuted = false, onToggleSound }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState<number>(0);
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/admin/withdrawals/pending-count");
        if (res.ok) {
          const data = await res.json();
          if (data.isAdmin) {
            setPendingWithdrawalsCount(data.count);
          }
        }
      } catch (e) {}
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 5000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleSignOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B0E14] border-b border-[#282C35]">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E51E3D] shadow-[0_0_8px_#E51E3D]" />
          <Link href="/" className="font-mono font-black text-lg sm:text-xl tracking-wider text-white hover:text-red-100 transition-colors">AVIATOR</Link>
          <span className="hidden xs:inline-block px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-[#FF2B4D] font-mono text-[10px] font-bold">KENYA LIVE</span>
          {isAdmin && (
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-black tracking-widest uppercase">ADMIN</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onToggleSound && (
            <button onClick={onToggleSound} className={`p-2 rounded-lg border transition-colors ${isMuted ? "bg-red-950/60 border-red-500/40 text-red-400" : "bg-[#10131A] border-[#282C35] text-[#00E575] hover:text-white"}`} title={isMuted ? "Unmute Engine Audio" : "Mute Engine Audio"}>
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#10131A] border border-[#282C35] rounded-lg font-mono">
            <span className="text-[10px] text-zinc-400 font-bold">KSH</span>
            <span className="text-xs sm:text-sm font-bold text-[#00E575]">{balance.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <Link href="/cashier" className="w-5 h-5 rounded bg-[#00E575] text-[#0B0E14] flex items-center justify-center font-bold text-xs hover:opacity-90 transition-transform active:scale-95" title="Deposit Funds via M-PESA">
              <Plus size={13} strokeWidth={3} />
            </Link>
            {isAdmin && (
              <Link href="/admin/withdrawals" className={`flex items-center gap-1 ml-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all active:scale-95 ${pendingWithdrawalsCount > 0 ? "bg-amber-950 text-amber-300 border-amber-500/70 hover:bg-amber-900 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.4)]" : "bg-[#191C22] text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-500"}`} title="Admin Withdrawal Clearance Terminal">
                {pendingWithdrawalsCount > 0 ? (
                  <><ShieldAlert size={12} className="text-amber-400" /><span className="hidden sm:inline">Clearance:</span><span className="font-mono font-black">{pendingWithdrawalsCount}</span></>
                ) : (
                  <><ShieldCheck size={12} className="text-[#00E575]" /><span className="hidden sm:inline">Approvals</span></>
                )}
              </Link>
            )}
          </div>
          <Link href="/withdraw" className="hidden sm:inline-block px-2.5 py-1 bg-[#191C22] hover:bg-[#282C35] border border-[#282C35] rounded-lg font-mono text-xs text-zinc-300 font-bold transition-colors">Withdraw</Link>
          <button onClick={handleSignOut} disabled={loggingOut} className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-[#191C22] hover:bg-red-950/70 text-zinc-300 hover:text-red-400 border border-[#282C35] hover:border-red-500/50 rounded-lg font-mono text-xs font-bold transition-all active:scale-95 disabled:opacity-50" title={`Sign Out (${username})`}>
            <LogOut size={14} className={loggingOut ? "animate-spin" : ""} />
            <span className="hidden md:inline">{loggingOut ? "Exiting..." : "Sign Out"}</span>
          </button>
        </div>
      </div>
      <div className="flex items-center justify-around py-1.5 px-2 bg-[#06080C] border-t border-[#191C22] overflow-hidden opacity-90">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0">
            <svg width="74" height="22" viewBox="0 0 120 40" fill="none">
              <path d="M5 25 C15 23, 45 21, 95 20 C105 19, 112 22, 114 25 C114 28, 105 31, 95 30 C45 30, 15 29, 5 25 Z" fill="#E51E3D" />
              <path d="M45 20 L70 5 C74 3, 80 4, 78 8 L60 20 Z" fill="#C4122E" />
              <path d="M42 28 L64 38 C67 40, 74 39, 72 36 L58 28 Z" fill="#9F0B23" />
              <path d="M5 25 L18 8 C20 5, 24 6, 23 10 L18 25 Z" fill="#E51E3D" />
              <line x1="114" y1="8" x2="114" y2="40" stroke="#FFFFFF" strokeWidth="2.5" />
            </svg>
          </div>
        ))}
      </div>
    </header>
  );
}
