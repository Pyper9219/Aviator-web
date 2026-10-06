"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, ListOrdered, Wallet, Banknote } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) return null;

  const items = [
    { label: "Flight Deck", href: "/", icon: Rocket },
    { label: "Live Bets", href: "/bets", icon: ListOrdered },
    { label: "Deposit (M-PESA/Airtel)", href: "/cashier", icon: Wallet },
    { label: "Withdraw", href: "/withdraw", icon: Banknote },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#10131A] border-t border-[#282C35] px-4 py-2 flex justify-around items-center md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-xs font-mono ${active ? "text-[#00E575]" : "text-zinc-400"}`}
          >
            <Icon size={18} className="mb-0.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
