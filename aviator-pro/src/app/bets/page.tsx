"use client";

import React, { useState } from "react";
import Header from "@/components/Header";

export default function BetsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      <Header balance={250.00} />
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6">
        <h1 className="text-xl font-bold font-mono mb-4">Pilot Leaderboard & Global Wagers</h1>
        <div className="bg-[#10131A] border border-[#282C35] rounded-xl p-4 font-mono text-xs space-y-2">
          <div className="grid grid-cols-4 text-zinc-500 pb-2 border-b border-[#282C35]">
            <span>PILOT</span>
            <span className="text-center">BET</span>
            <span className="text-center">MULT</span>
            <span className="text-right">PAYOUT</span>
          </div>
          <div className="grid grid-cols-4 py-2 border-b border-[#191C22]">
            <span className="text-zinc-200 font-bold">Juma_TZ (Airtel)</span>
            <span className="text-center text-zinc-400">$50.00</span>
            <span className="text-center text-[#00E575] font-bold">4.10x</span>
            <span className="text-right text-[#00E575] font-bold">+$205.00</span>
          </div>
          <div className="grid grid-cols-4 py-2">
            <span className="text-zinc-200 font-bold">Otieno_NBO (M-PESA)</span>
            <span className="text-center text-zinc-400">$100.00</span>
            <span className="text-center text-[#00E575] font-bold">2.40x</span>
            <span className="text-right text-[#00E575] font-bold">+$240.00</span>
          </div>
        </div>
      </main>
    </div>
  );
}
