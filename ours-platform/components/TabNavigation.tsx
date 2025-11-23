'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, User, Wallet, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TabNavigation() {
  const pathname = usePathname();

  const tabs = [
    { id: 'marketplace', label: 'Marketplace', icon: Store, href: '/marketplace' },
    { id: 'holdings', label: 'Holdings', icon: Wallet, href: '/holdings' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
    { id: 'support', label: 'Support', icon: MessageCircle, href: '/support' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t-2 border-black/10 md:hidden">
      <div className="flex items-center justify-around px-2 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="relative flex flex-col items-center gap-1 px-3 py-2 transition-all"
            >
              <div className={`transition-colors ${isActive ? 'text-[#2D2E63]' : 'text-[#1E2046]/40'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-[#2D2E63]' : 'text-[#1E2046]/40'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-0 right-0 h-1 bg-[#2D2E63] rounded-b-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
