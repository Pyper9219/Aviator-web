'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';

export default function BetsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'top'>('all');
  const [chatMessage, setChatMessage] = useState('');
  const [comments, setComments] = useState([
    { user: 'Viper_07', text: "Let's go to 20x!! 🚀" },
    { user: 'LuckyAce', text: 'Cashed at 3.42x nice!' },
  ]);

  const allBets = [
    { pilot: 'QueenKate', vip: 'VIP-9', bet: 500, mult: 12.50, payout: 6250.00, cashed: true },
    { pilot: 'LuckyAce***', vip: 'VIP-3', bet: 50, mult: 3.42, payout: 171.00, cashed: true },
    { pilot: 'Viper_07', vip: 'VIP-1', bet: 120, mult: 2.32, payout: 261.60, cashed: false },
    { pilot: 'crypto_king', vip: 'VIP-4', bet: 250, mult: 2.32, payout: 545.00, cashed: false },
    { pilot: 'Alex99', vip: 'VIP-1', bet: 15, mult: 0, payout: 0, cashed: false, lost: true },
    { pilot: 'FalconBot_2', vip: 'BOT', bet: 100, mult: 1.50, payout: 150.00, cashed: true },
  ];

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setComments((prev) => [...prev, { user: 'You (Ace)', text: chatMessage }]);
    setChatMessage('');
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header balance={4850.50} />

      <div className="px-4 py-3 bg-[#10131A] border-b border-[#282C35] flex items-center justify-between">
        <div>
          <div className="text-[10px] text-zinc-400 font-mono">ROUND #948,201</div>
          <div className="text-xl font-mono font-black text-[#00E575]">
            2.32x <span className="text-xs text-zinc-400 font-normal">+0.04/s</span>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono text-zinc-400">
          <div>412 Pilots in Orbit</div>
          <div className="text-zinc-200">Pool: $38,420.00</div>
        </div>
      </div>

      <div className="flex border-b border-[#282C35] bg-[#0B0E14] px-4 pt-2 gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'all' ? 'border-[#00E575] text-[#00E575]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          All Bets (384)
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'my' ? 'border-[#00E575] text-[#00E575]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          My Bets (12)
        </button>
        <button
          onClick={() => setActiveTab('top')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'top' ? 'border-[#00E575] text-[#00E575]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Top Wins
        </button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        <div className="grid grid-cols-4 text-[10px] font-mono text-zinc-500 px-2 py-1">
          <span>PILOT</span>
          <span className="text-center">BET</span>
          <span className="text-center">MULT</span>
          <span className="text-right">PAYOUT</span>
        </div>

        {allBets.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-4 items-center bg-[#10131A] border border-[#282C35] rounded-lg px-3 py-2 text-xs font-mono"
          >
            <div>
              <div className="font-bold text-zinc-200 truncate">{row.pilot}</div>
              <div className="text-[10px] text-zinc-500">{row.vip}</div>
            </div>
            <div className="text-center text-zinc-300">${row.bet.toFixed(2)}</div>
            <div className="text-center">
              {row.lost ? (
                <span className="text-red-500 font-bold">Lost</span>
              ) : row.cashed ? (
                <span className="text-[#00E575] font-bold">{row.mult.toFixed(2)}x</span>
              ) : (
                <span className="text-amber-400 font-bold">Orbiting</span>
              )}
            </div>
            <div className="text-right font-bold text-[#00E575]">
              {row.lost ? '$0.00' : `+$${row.payout.toFixed(2)}`}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-[#10131A] border-t border-[#282C35]">
        <div className="space-y-1 mb-2 max-h-24 overflow-y-auto font-mono text-xs">
          {comments.map((c, i) => (
            <div key={i} className="text-zinc-300">
              <span className="text-[#00E575] font-bold">{c.user}: </span>
              {c.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleSendChat} className="flex gap-2">
          <input
            type="text"
            placeholder="Type pilot message..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            className="flex-1 bg-[#0B0E14] border border-[#282C35] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E575]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#E51E3D] hover:bg-[#FF2B4D] text-white rounded-lg text-xs font-bold"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
