"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Lock, User, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loginCredential, setLoginCredential] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginCredential, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

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
            <div className="text-[10px] font-mono text-zinc-400">RESTRICTED PILOT ACCESS</div>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-1">Pilot Cockpit Sign In</h1>
        <p className="text-xs text-zinc-400 mb-6">
          Only registered pilots can view live multipliers, place bets, and deposit.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-zinc-300 block mb-1">USERNAME OR PHONE</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-zinc-500" size={16} />
              <input
                type="text"
                required
                placeholder="Callsign or phone number"
                value={loginCredential}
                onChange={(e) => setLoginCredential(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E575]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-300 block mb-1">PASSWORD</label>
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
            className="w-full mt-2 bg-[#00E575] hover:bg-[#00FF82] disabled:opacity-50 text-[#0B0E14] font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <LogIn size={16} />
                <span>Enter Cockpit</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#282C35] text-center text-xs text-zinc-400">
          Do not have an account yet?{" "}
          <Link href="/auth/register" className="text-[#E51E3D] font-bold hover:underline">
            Register Pilot Callsign
          </Link>
        </div>
      </div>
    </div>
  );
}
