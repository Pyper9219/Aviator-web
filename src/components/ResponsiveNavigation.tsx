"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListOrdered, Rocket, Wallet } from "lucide-react";

const items = [
  { label: "Flight", href: "/", icon: Rocket },
  { label: "Bets", href: "/bets", icon: ListOrdered },
  { label: "Deposit", href: "/cashier", icon: Wallet },
];

export default function ResponsiveNavigation() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/auth")) return null;

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-[#282C35] bg-[#10131A]/95 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:flex md:justify-center md:gap-8 md:px-4 md:py-3"
    >
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-[9px] font-mono sm:text-[10px] md:flex-row md:gap-2 md:px-2 md:text-sm ${
              active ? "text-[#00E575]" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
