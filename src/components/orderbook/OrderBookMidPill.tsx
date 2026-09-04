'use client';

import React from 'react';
import type { OrderBookState } from './orderBookHelpers';

interface OrderBookMidPillProps {
  book: OrderBookState;
}

export default function OrderBookMidPill({ book }: OrderBookMidPillProps) {
  if (book.asks.length === 0 || book.bids.length === 0) return null;

  return (
    <div className="relative shrink-0 w-full text-center py-2.5 z-20 pointer-events-none font-sans">
      {/* Horizontal dividing line spanning full width */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border-default dark:bg-zinc-700/80 z-0" />

      {/* Centered Theme-Adaptive Pill Badge */}
      <div className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-card dark:bg-[#373e4d] text-text-primary dark:text-white px-3.5 py-0.5 shadow-xl border border-border-default dark:border-slate-500/60 pointer-events-auto">
        <span className="text-[12px] font-black font-sans tracking-tight text-text-primary dark:text-white">
          {book.midPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-[9.5px] font-extrabold text-text-muted dark:text-zinc-400 uppercase">MID</span>
        <span className="text-[10px] text-text-muted dark:text-zinc-400 font-light">|</span>
        <span className="text-[11px] font-extrabold text-amber-500 dark:text-amber-400 font-sans tracking-tight">
          {book.spread.toFixed(2)} ({book.spreadPct}%)
        </span>
      </div>
    </div>
  );
}

