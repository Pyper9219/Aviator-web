'use client';

import React from 'react';
import { Trophy, Share2, Camera, X } from 'lucide-react';

interface WinResultModalProps {
  winData: { multiplier: number; profit: number; stake: number } | null;
  onClose: () => void;
}

export default function WinResultModal({ winData, onClose }: WinResultModalProps) {
  if (!winData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-[#10131A] border border-[#00E575]/40 rounded-2xl p-6 text-center shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 rounded-full bg-[#00E575]/20 text-[#00E575] flex items-center justify-center mx-auto mb-3">
          <Trophy size={28} />
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#00E575]/20 text-[#00E575] text-xs font-mono font-bold mb-2">
          SUCCESSFUL CASHOUT!
        </div>

        <h3 className="text-zinc-400 text-xs font-mono uppercase">Cashed Out At</h3>
        <div className="text-3xl font-black text-white font-mono my-1">
          {winData.multiplier.toFixed(2)}x
        </div>

        <div className="bg-[#191C22] rounded-xl p-3 my-4 border border-[#282C35]">
          <span className="text-xs text-zinc-400">Total Profit Won</span>
          <div className="text-2xl font-black text-[#00E575] font-mono">
            +${winData.profit.toFixed(2)}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            Stake: ${winData.stake.toFixed(2)} USD
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => alert('Result copied to clipboard!')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#E51E3D] hover:bg-[#FF2B4D] text-white rounded-lg text-xs font-bold transition-colors"
          >
            <Share2 size={14} /> BRAG WIN
          </button>
          <button
            onClick={() => alert('Screenshot captured!')}
            className="p-2.5 bg-[#191C22] border border-[#282C35] rounded-lg text-zinc-300 hover:text-white"
          >
            <Camera size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
