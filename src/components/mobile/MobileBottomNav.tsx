'use client';

import React from 'react';
import {
  BarChart3,
  List,
  Brain,
  BookOpen,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { MobileView } from '../../types/mobile';
import { useMobileNavStore } from '../../store/useMobileNavStore';

interface MobileBottomNavProps {
  activeView?: MobileView;
  onViewChange?: (view: MobileView) => void;
}

interface NavItem {
  key: MobileView;
  label: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'chart', label: 'Chart', Icon: BarChart3 },
  { key: 'watchlist', label: 'Watch', Icon: List },
  { key: 'agent', label: 'AI Agent', Icon: Brain },
  { key: 'orderbook', label: 'Book', Icon: BookOpen },
  { key: 'profile', label: 'Profile', Icon: User },
];

/**
 * Fixed bottom tab bar for mobile navigation.
 * Mirrors the desktop NavRail + RightSidebar rail functionality
 * in a single, thumb-friendly bottom bar.
 */
export default function MobileBottomNav({
  activeView: propActiveView,
  onViewChange: propOnViewChange,
}: MobileBottomNavProps) {
  const storeActiveView = useMobileNavStore((s) => s.activeView);
  const storeSetActiveView = useMobileNavStore((s) => s.setActiveView);

  const activeView = propActiveView ?? storeActiveView;
  const onViewChange = propOnViewChange ?? storeSetActiveView;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-border-default bg-surface md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const isActive = activeView === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onViewChange(key)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={`
              flex flex-1 flex-col items-center justify-center gap-0.5 py-1
              transition-colors duration-150 cursor-pointer
              ${isActive
                ? 'text-emerald-500'
                : 'text-text-muted active:text-text-primary'
              }
            `}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className={`text-[9px] font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

