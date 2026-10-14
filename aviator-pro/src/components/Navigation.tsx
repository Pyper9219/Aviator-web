"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, ListOrdered, Wallet, Banknote } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) return null;

  const items = [
    { label: "Flight", href: "/", icon: Rocket },
    { label: "Bets", href: "/bets", icon: ListOrdered },
    { label: "Wallet", href: "/cashier", icon: Wallet },
    { label: "Withdraw", href: "/withdraw", icon: Banknote },
  ];

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[#282C35] bg-[#10131A]/95 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-[10px] font-mono ${active ? "text-[#00E575]" : "text-zinc-400"}`}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Desktop navigation" className="fixed inset-x-0 bottom-0 z-50 hidden border-t border-[#282C35] bg-[#10131A]/95 px-3 py-3 backdrop-blur md:block">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8">
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
