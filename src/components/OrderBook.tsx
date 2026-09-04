'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { useTradeStore } from '../store/useTradeStore';
import { crossfade } from '../lib/motionVariants';
import { depthPercent, formatSize } from './orderbook/orderBookHelpers';
import { useOrderBookData } from './orderbook/useOrderBookData';
import OrderBookMidPill from './orderbook/OrderBookMidPill';
import OrderBookVolumeRatio from './orderbook/OrderBookVolumeRatio';
import MarketDepthStats from './orderbook/MarketDepthStats';

export default function OrderBook() {
  const selectedSymbol = useTradeStore((s) => s.selectedSymbol);
  const { book, isLive, stats } = useOrderBookData(selectedSymbol);

  // ── Ask-ladder scroll anchoring ──────────────────────────────────────
  // `book.asks` is ordered farthest-ask-first (the builder reverses it), so the
  // BEST ask — the one that matters, sitting right above the mid price — is the
  // LAST row. A scroll container starts at scrollTop 0, i.e. showing the
  // farthest levels, which would push the best ask out of view. Anchor to the
  // bottom once per symbol, then leave the scroll position alone so scrolling up
  // to inspect deeper levels isn't yanked back on the next 2s tick.
  const asksScrollRef = useRef<HTMLDivElement>(null);
  const asksAnchoredRef = useRef(false);

  useEffect(() => {
    asksAnchoredRef.current = false;
  }, [selectedSymbol]);

  useEffect(() => {
    if (asksAnchoredRef.current || book.asks.length === 0) return;
    const el = asksScrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const node = asksScrollRef.current;
      if (!node) return;
      node.scrollTop = node.scrollHeight;
      asksAnchoredRef.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [book.asks.length]);

  const { globalMaxSize, askVolPct, bidVolPct } = React.useMemo(() => {
    const maxAskSize =
      book.asks.length > 0 ? Math.max(...book.asks.map((l) => l.size), 0.01) : 0.01;
    const maxBidSize =
      book.bids.length > 0 ? Math.max(...book.bids.map((l) => l.size), 0.01) : 0.01;

    const totalAskVol = book.asks.reduce((s, l) => s + l.size, 0);
    const totalBidVol = book.bids.reduce((s, l) => s + l.size, 0);
    const totalVol = totalAskVol + totalBidVol || 1;

    return {
      globalMaxSize: Math.max(maxAskSize, maxBidSize),
      askVolPct: (totalAskVol / totalVol) * 100,
      bidVolPct: (totalBidVol / totalVol) * 100,
    };
  }, [book]);

  return (
    <div
      id="order-book-dom"
      className="flex min-h-full flex-col rounded-none border-0 bg-surface font-sans text-[12.5px] select-none"
    >
      {/* ── Column Headers ──────────────────────────────────── */}
      <div className="grid shrink-0 grid-cols-3 gap-0 border-b border-border-default bg-elevated/30 px-3.5 py-2 text-[11px] font-extrabold text-text-muted uppercase tracking-wider font-sans">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* ── Awaiting Data State ───────────────────────────── */}
      <AnimatePresence>
        {!isLive && book.asks.length === 0 && (
          <motion.div
            variants={crossfade}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-1 items-center justify-center font-sans py-8"
          >
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-none bg-elevated">
                <BarChart3 size={14} className="text-text-muted" />
              </div>
              <p className="text-[12px] font-bold text-text-muted leading-snug">
                Awaiting Market Depth Data...
              </p>
              <p className="text-[10px] text-text-muted/70">
                Order book populates when live depth feed connects
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ask Levels (Red) — Scrollable without scrollbar ─────────── */}
      {book.asks.length > 0 && (
        <div
          ref={asksScrollRef}
          className="flex flex-col flex-initial min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] font-sans"
        >
          <div className="mt-auto">
            {book.asks.map((level, i) => (
              <div
                key={`ask-${i}`}
                className="group relative grid grid-cols-3 gap-0 px-3.5 py-0.75 hover:bg-red-500/10"
              >
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 bg-red-500/12"
                  style={{ width: `${depthPercent(level.size, globalMaxSize)}%` }}
                />
                <span className="relative z-10 tabular-nums font-extrabold text-[#ef4444]">
                  {level.price.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="relative z-10 tabular-nums text-right font-bold text-red-400/90">
                  {formatSize(level.size)}
                </span>
                <span className="relative z-10 tabular-nums text-right font-bold text-zinc-400">
                  {formatSize(level.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mid Price / Spread Floating Pill Row ──────────── */}
      <OrderBookMidPill book={book} />

      {/* ── Bid Levels (Green) — Scrollable without scrollbar ────────── */}
      {book.bids.length > 0 && (
        <div className="flex flex-col flex-initial min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] font-sans">
          {book.bids.map((level, i) => (
            <div
              key={`bid-${i}`}
              className="group relative grid grid-cols-3 gap-0 px-3.5 py-0.75 hover:bg-emerald-500/10"
            >
              <div
                className="pointer-events-none absolute inset-y-0 right-0 bg-emerald-500/12"
                style={{ width: `${depthPercent(level.size, globalMaxSize)}%` }}
              />
              <span className="relative z-10 tabular-nums font-extrabold text-bull">
                {level.price.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="relative z-10 tabular-nums text-right font-bold text-emerald-400/90">
                {formatSize(level.size)}
              </span>
              <span className="relative z-10 tabular-nums text-right font-bold text-zinc-400">
                {formatSize(level.total)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Ask/Bid Volume Ratio Bar ────────────────────────── */}
      {book.asks.length > 0 && book.bids.length > 0 && (
        <OrderBookVolumeRatio bidVolPct={bidVolPct} askVolPct={askVolPct} />
      )}

      {/* ── Zerodha-style Market Depth Statistics Card ───────── */}
      <MarketDepthStats stats={stats} symbol={selectedSymbol} />
    </div>
  );
}
