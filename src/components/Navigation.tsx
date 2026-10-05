'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, ListOrdered, History, Shield, User } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Game', href: '/', icon: Rocket },
    { label: 'Bets', href: '/bets', icon: ListOrdered },
    { label: 'Cashier', href: '/cashier', icon: History },
    { label: 'Fairness', href: '#', icon: Shield },
    { label: 'Profile', href: '#', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#10131A] border-t border-[#282C35] px-2 py-1.5 flex justify-around items-center">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
              isActive ? 'text-[#00E575]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon size={18} className="mb-1" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
