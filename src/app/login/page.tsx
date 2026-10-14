"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plane, Lock, User, Phone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ username: "", phoneOrEmail: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#10131A] border border-[#282C35] rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-3 h-3 rounded-full bg-[#E51E3D]" />
          <span className="font-mono font-black text-2xl tracking-wider text-white">AVIATOR</span>
          <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-[#FF2B4D] font-mono text-[10px] font-bold">KENYA LIVE</span>
        </div>
        
        <div className="flex bg-[#0B0E14] rounded-xl p-1 mb-6 border border-[#282C35]">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? "bg-[#E51E3D] text-white" : "text-zinc-400"}`}>Login</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? "bg-[#00E575] text-[#0B0E14]" : "text-zinc-400"}`}>Sign Up</button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 rounded-lg text-xs text-red-300 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User size={16} className="absolute left-3 top-3.5 text-zinc-500" />
              <input type="text" required placeholder="Pilot Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E575]" />
            </div>
          )}
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-3.5 text-zinc-500" />
            <input type="text" required placeholder="Phone Number or Email" value={formData.phoneOrEmail} onChange={e => setFormData({...formData, phoneOrEmail: e.target.value})} className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E575]" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3.5 text-zinc-500" />
            <input type="password" required placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[#0B0E14] border border-[#282C35] rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00E575]" />
          </div>
          
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#E51E3D] hover:bg-[#FF2B4D] disabled:opacity-50 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-all">
            {loading ? "Processing..." : (isLogin ? "Launch Game" : "Create Pilot Account")}
          </button>
        </form>
        
        <p className="text-center text-[10px] text-zinc-500 font-mono mt-6">18+ Play Responsibly. Provably Fair.</p>
      </div>
    </div>
  );
}
