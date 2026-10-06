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
    <>
      <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#282C35] bg-[#10131A] px-2 py-2 md:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center text-center text-[10px] font-mono ${active ? "text-[#00E575]" : "text-zinc-400"}`}
            >
              <Icon size={18} className="mb-0.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Desktop navigation" className="fixed bottom-0 left-0 right-0 z-50 hidden border-t border-[#282C35] bg-[#10131A]/95 px-6 py-3 backdrop-blur md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-8">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const label = item.href === "/cashier" ? "Deposit" : item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 text-sm font-mono transition-colors hover:text-white ${active ? "text-[#00E575]" : "text-zinc-400"}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
