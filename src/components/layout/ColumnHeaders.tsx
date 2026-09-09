'use client';

import React from 'react';
import type { SearchTab } from './useSymbolSearch';

export interface ColumnHeadersProps {
  activeTab: SearchTab;
  selectedExchange: 'NSE' | 'BSE' | 'ALL';
  showExchangeMenu: boolean;
  setShowExchangeMenu: (v: boolean) => void;
  setSelectedExchange: (v: 'NSE' | 'BSE' | 'ALL') => void;
  setSelectedIndex: (v: number) => void;
  exchangeMenuRef: React.RefObject<HTMLDivElement | null>;
}

export default function ColumnHeaders({
  activeTab,
  selectedExchange,
  showExchangeMenu,
  setShowExchangeMenu,
  setSelectedExchange,
  setSelectedIndex,
  exchangeMenuRef,
}: ColumnHeadersProps) {
  return (
    <div className="flex justify-between items-center px-4 py-1.5 border-b border-border-default/30 text-[10px] font-bold text-text-muted tracking-wider bg-surface/30 dark:bg-black/20">
      <div className="flex items-center gap-3">
        {activeTab === 'F&O' ? (
          <>
            <span className="w-14">TYPE</span>
            <span>CONTRACT</span>
          </>
        ) : (
          <>
            <span className="w-[132px]">SYMBOL</span>
            <span>DESCRIPTION</span>
          </>
        )}
      </div>
      {activeTab !== 'F&O' ? (
        <div className="relative" ref={exchangeMenuRef}>
          <button
            onClick={() => setShowExchangeMenu(!showExchangeMenu)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-elevated/45 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <span>{selectedExchange}</span>
            <ChevronDownIcon />
          </button>
          {showExchangeMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 w-24 rounded-lg border border-border-default/80 bg-surface/95 dark:bg-[#181a20]/95 backdrop-blur-xl shadow-xl py-1 text-center">
              {(['NSE', 'BSE', 'ALL'] as const).map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setSelectedExchange(ex);
                    setShowExchangeMenu(false);
                    setSelectedIndex(0);
                  }}
                  className={`w-full text-center px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider hover:bg-elevated/40 transition-colors ${
                    selectedExchange === ex
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : 'text-text-muted'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <span className="text-text-primary/70 font-bold uppercase text-[9px] tracking-wider">
          NFO
        </span>
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-3 w-3 text-text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

