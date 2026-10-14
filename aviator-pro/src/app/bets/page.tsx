"use client";

import React, { useState } from "react";
import Header from "@/components/Header";

export default function BetsPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      <Header balance={250.00} />
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6">
        <h1 className="text-xl font-bold font-mono mb-4">Pilot Leaderboard &amp; Global Wagers</h1>
        <div className="bg-[#10131A] border border-[#282C35] rounded-xl p-4 font-mono text-xs space-y-2">
          <div className="hidden sm:grid sm:grid-cols-4 text-zinc-500 pb-2 border-b border-[#282C35]">
            <span>PILOT</span>
            <span className="text-center">BET</span>
            <span className="text-center">MULT</span>
            <span className="text-right">PAYOUT</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 border-b border-[#191C22] py-3 sm:grid-cols-4 sm:gap-y-0 sm:py-2">
            <span className="col-span-2 break-words font-bold text-zinc-200 sm:col-span-1">Juma_TZ (Airtel)</span>
            <span className="text-zinc-400 sm:text-center"><span className="text-zinc-500 sm:hidden">BET </span>$50.00</span>
            <span className="text-[#00E575] font-bold sm:text-center"><span className="text-zinc-500 font-normal sm:hidden">MULT </span>4.10x</span>
            <span className="text-right font-bold text-[#00E575]"><span className="text-zinc-500 font-normal sm:hidden">PAYOUT </span>+$205.00</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 py-3 sm:grid-cols-4 sm:gap-y-0 sm:py-2">
            <span className="col-span-2 break-words font-bold text-zinc-200 sm:col-span-1">Otieno_NBO (M-PESA)</span>
            <span className="text-zinc-400 sm:text-center"><span className="text-zinc-500 sm:hidden">BET </span>$100.00</span>
            <span className="text-[#00E575] font-bold sm:text-center"><span className="text-zinc-500 font-normal sm:hidden">MULT </span>2.40x</span>
            <span className="text-right font-bold text-[#00E575]"><span className="text-zinc-500 font-normal sm:hidden">PAYOUT </span>+$240.00</span>
          </div>
        </div>
      </main>
    </div>
  );
}
