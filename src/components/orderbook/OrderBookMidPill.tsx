'use client';

import React from 'react';
import type { OrderBookState } from './orderBookHelpers';

interface OrderBookMidPillProps {
  book: OrderBookState;
  lastPrice?: number | null;
}

export default function OrderBookMidPill({ book, lastPrice }: OrderBookMidPillProps) {
  const hasMid = book.midPrice > 0;
  const ltp = lastPrice ?? 0;
  const displayPrice = hasMid ? book.midPrice : ltp;
  const label = hasMid ? 'MID' : 'LTP';

  return (
    <div className="relative shrink-0 w-full text-center py-2 z-20 pointer-events-none font-sans">
      {/* Horizontal dividing line spanning full width */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border-default dark:bg-zinc-700/80 z-0" />

      {/* Centered Theme-Adaptive Pill Badge */}
      <div className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-card dark:bg-[#373e4d] text-text-primary dark:text-white px-3.5 py-0.5 shadow-xl border border-border-default dark:border-slate-500/60 pointer-events-auto">
        <span className="text-[12px] font-black font-sans tracking-tight text-text-primary dark:text-white">
          {displayPrice.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-[9.5px] font-extrabold text-text-muted dark:text-zinc-400 uppercase">
          {label}
        </span>
        <span className="text-[10px] text-text-muted dark:text-zinc-400 font-light">|</span>
        <span className="text-[11px] font-extrabold text-amber-500 dark:text-amber-400 font-sans tracking-tight">
          {book.spread > 0 ? `${book.spread.toFixed(2)} (${book.spreadPct}%)` : '0.00 (0.000%)'}
        </span>
      </div>
    </div>
  );
}
