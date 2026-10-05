"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus, PhoneCall, Lock, User, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, phoneOrEmail, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create pilot account");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-[#10131A] border border-[#282C35] rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#E51E3D] rounded flex items-center justify-center font-bold text-white text-sm">
            ▲
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-wider text-white">
              AERO<span className="text-[#E51E3D]">CRASH</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">PILOT REGISTRATION</div>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-1">Create Pilot Account</h1>
        <p className="text-xs text-zinc-400 mb-6">
          Access the live flight deck, place dual bets, and withdraw funds with M-PESA & Airtel Money.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-zinc-300 block mb-1">PILOT CALLSIGN (USERNAME)</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-zinc-500" size={16} />
              <input
                type="text"
                required
                placeholder="e.g. AcePilot_01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E575]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-300 block mb-1">PHONE NUMBER OR EMAIL</label>
            <div className="relative">
              <PhoneCall className="absolute left-3 top-3 text-zinc-500" size={16} />
              <input
                type="text"
                required
                placeholder="0712345678 or pilot@email.com"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E575]"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Used for M-PESA / Airtel Money instant STK withdrawals</span>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-300 block mb-1">COCKPIT ACCESS PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-500" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E575]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#E51E3D] hover:bg-[#FF2B4D] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <UserPlus size={16} />
                <span>Create Account & Enter Flight Deck</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#282C35] text-center text-xs text-zinc-400">
          Already registered?{" "}
          <Link href="/auth/login" className="text-[#00E575] font-bold hover:underline">
            Login to Cockpit
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-zinc-500 mt-4">
          <ShieldCheck size={14} className="text-[#00E575]" />
          <span>PROVABLY FAIR 97% RTP • 256-BIT ENCRYPTION</span>
        </div>
      </div>
    </div>
  );
}
