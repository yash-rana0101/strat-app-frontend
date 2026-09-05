'use client';

import React from 'react';
import { Search, Maximize2, Minimize2 } from 'lucide-react';
import { isFnoSymbol } from '../../charting/symbolUtils';
import { useTradeStore } from '../../store/useTradeStore';
import { useChartUIStore } from '../../store/useChartUIStore';
import { useMobileNavStore } from '../../store/useMobileNavStore';

interface MobileChartHeaderProps {
  onOpenSearch?: () => void;
}

/**
 * Compact mobile header above the chart showing symbol, timeframe, exchange badge,
 * search button, and fullscreen toggle.
 */
export default function MobileChartHeader({ onOpenSearch: propOpenSearch }: MobileChartHeaderProps) {
  const selectedSymbol = useTradeStore((s) => s.selectedSymbol);
  const activeTimeframe = useTradeStore((s) => s.activeTimeframe);
  const activeProfile = useTradeStore((s) => s.activeProfile);
  const isFullscreen = useChartUIStore((s) => s.isFullscreen);
  const setIsFullscreen = useChartUIStore((s) => s.setIsFullscreen);
  const storeOpenSearch = useMobileNavStore((s) => s.openSearch);

  const handleOpenSearch = propOpenSearch ?? (() => storeOpenSearch());

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-border-default/40 bg-surface px-3 md:hidden">
      <button
        type="button"
        onClick={handleOpenSearch}
        className="flex items-center gap-2 min-w-0 text-left cursor-pointer group"
      >
        <span className="text-xs font-bold text-text-primary group-hover:text-emerald-400 transition-colors truncate">
          {selectedSymbol}
        </span>
        <span className="rounded-sm border border-border-default bg-elevated/60 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-text-muted">
          {activeTimeframe}
        </span>
        <span className="rounded-sm border border-border-default bg-elevated/60 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-text-muted">
          {isFnoSymbol(selectedSymbol) ? 'NFO' : 'NSE'}
        </span>
        <span className="rounded-sm border border-border-default bg-elevated px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-text-secondary">
          {activeProfile}
        </span>
      </button>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleOpenSearch}
          aria-label="Search symbol"
          className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-elevated transition-colors cursor-pointer"
        >
          <Search size={14} />
        </button>
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-elevated transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
}

