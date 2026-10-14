"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LogOut, Volume2, VolumeX } from "lucide-react";

interface HeaderProps {
  balance: number;
  username?: string;
}

export default function Header({ balance, username }: HeaderProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = React.useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B0E14] border-b border-[#282C35]">
      {/* Top Row: Brand & Live KSh Balance */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E51E3D]" />
          <span className="font-mono font-black text-lg tracking-wider text-white">
            AVIATOR
          </span>
          <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-[#FF2B4D] font-mono text-[10px] font-bold">
            KENYA LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#10131A] border border-[#282C35] rounded-lg font-mono">
            <span className="text-[10px] text-zinc-400 font-bold">KSH</span>
            <span className="text-sm font-bold text-[#00E575]">
              {balance.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <Link href="/cashier" className="w-5 h-5 rounded bg-[#00E575] text-[#0B0E14] flex items-center justify-center font-bold text-xs hover:opacity-90 transition-transform active:scale-95" title="Deposit Funds via M-PESA">
              <Plus size={13} strokeWidth={3} />
            </Link>
          </div>
          <Link href="/withdraw" className="px-2.5 py-1 bg-[#191C22] hover:bg-[#282C35] border border-[#282C35] rounded-lg font-mono text-xs text-zinc-300 font-bold transition-colors">
            Withdraw
          </Link>
          
          {/* MUTE BUTTON */}
          <button
            onClick={() => setIsMuted(m => !m)}
            className="p-2 bg-[#191C22] hover:bg-[#282C35] border border-[#282C35] rounded-lg text-zinc-300 hover:text-white transition-colors"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 rounded-lg font-mono text-xs text-red-300 font-bold transition-colors"
            title="Sign Out"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
      {/* Repeating Red Aeroplane Silhouette Ribbon */}
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
