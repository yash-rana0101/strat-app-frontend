'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface PatternTimeframeTabsProps {
  timeframes: readonly string[];
  selectedTf: string;
  onSelectTf: (tf: string) => void;
  getPatternCount: (tf: string) => number;
  isFetchingPatterns: boolean;
  inSheet: boolean;
}

export default function PatternTimeframeTabs({
  timeframes,
  selectedTf,
  onSelectTf,
  getPatternCount,
  isFetchingPatterns,
  inSheet,
}: PatternTimeframeTabsProps) {
  const pad = inSheet ? 'px-4' : 'px-3';

  return (
    <div className={`flex gap-1.5 overflow-x-auto pb-2 scrollbar-none ${pad}`}>
      {timeframes.map((tf) => {
        const count = getPatternCount(tf);
        const isActive = selectedTf === tf;
        return (
          <button
            key={tf}
            type="button"
            onClick={() => onSelectTf(tf)}
            aria-pressed={isActive}
            aria-label={`${tf} timeframe, ${count} pattern${count === 1 ? '' : 's'}`}
            className={`
              flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold shrink-0 border
              transition-all duration-150 cursor-pointer
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary
              ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm'
                  : count > 0
                    ? 'bg-surface text-text-secondary border-border-default/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
                    : 'bg-surface/50 text-text-muted border-border-default/20 hover:bg-emerald-500/10'
              }
            `}
          >
            <span>{tf}</span>
            {isFetchingPatterns ? (
              <Loader2 size={8} className="animate-spin text-text-muted" />
            ) : count > 0 ? (
              <span
                className={`
                  flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[8px] font-mono font-bold border
                  ${
                    isActive
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-elevated text-text-muted border-border-default/50'
                  }
                `}
              >
                {count}
              </span>
            ) : (
              <span className="text-[8px] opacity-30 font-mono">0</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
