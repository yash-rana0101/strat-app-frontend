'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useMobileNavStore } from '../../store/useMobileNavStore';

interface MobileWatchlistViewProps {
  children: React.ReactNode;
  onOpenSearch?: () => void;
}

/**
 * Full-screen mobile wrapper around the existing LeftPanel / WatchlistPanel.
 * Adds a header with title and search trigger.
 */
export default function MobileWatchlistView({
  children,
  onOpenSearch: propOpenSearch,
}: MobileWatchlistViewProps) {
  const storeOpenSearch = useMobileNavStore((s) => s.openSearch);
  const handleOpenSearch = propOpenSearch ?? (() => storeOpenSearch());

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border-default/40 px-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
          Market Watch
        </span>
        <button
          type="button"
          onClick={handleOpenSearch}
          aria-label="Search symbols"
          className="flex items-center justify-center rounded p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <Search size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

