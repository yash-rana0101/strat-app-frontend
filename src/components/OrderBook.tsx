'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useTradeStore } from '../store/useTradeStore';
import { depthPercent, formatSize, type OrderBookLevel } from './orderbook/orderBookHelpers';
import { useOrderBookData } from './orderbook/useOrderBookData';
import OrderBookMidPill from './orderbook/OrderBookMidPill';
import OrderBookVolumeRatio from './orderbook/OrderBookVolumeRatio';
import MarketDepthStats from './orderbook/MarketDepthStats';

export default function OrderBook() {
  const selectedSymbol = useTradeStore((s) => s.selectedSymbol);
  const { book, isLive, stats } = useOrderBookData(selectedSymbol);

  // ── Zerodha 5-level depth normalization ─────────────────────────────
  // When market is closed or order book has fewer than 5 levels, pad with
  // 0.00 / 0 / 0 levels (exactly as Zerodha Kite displays in its market depth).
  const displayAsks = useMemo(() => {
    const real = book.asks;
    if (real.length >= 5) return real;
    const padCount = 5 - real.length;
    const zeros: OrderBookLevel[] = Array.from({ length: padCount }, () => ({
      price: 0,
      size: 0,
      total: 0,
    }));
    // Asks are ordered with highest ask at the top and best ask at the bottom
    // (closest to Mid Pill), so the zero-padding sits at the top.
    return [...zeros, ...real];
  }, [book.asks]);

  const displayBids = useMemo(() => {
    const real = book.bids;
    if (real.length >= 5) return real;
    const padCount = 5 - real.length;
    const zeros: OrderBookLevel[] = Array.from({ length: padCount }, () => ({
      price: 0,
      size: 0,
      total: 0,
    }));
    // Bids are ordered with best bid at the top (closest to Mid Pill) and
    // lowest at the bottom, so zero-padding sits at the bottom.
    return [...real, ...zeros];
  }, [book.bids]);

  // ── Ask-ladder scroll anchoring ──────────────────────────────────────
  const asksScrollRef = useRef<HTMLDivElement>(null);
  const asksAnchoredRef = useRef(false);

  useEffect(() => {
    asksAnchoredRef.current = false;
  }, [selectedSymbol]);

  useEffect(() => {
    if (asksAnchoredRef.current || displayAsks.length === 0) return;
    const el = asksScrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const node = asksScrollRef.current;
      if (!node) return;
      node.scrollTop = node.scrollHeight;
      asksAnchoredRef.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [displayAsks.length]);

  const { globalMaxSize, askVolPct, bidVolPct, totalAskVol, totalBidVol } = useMemo(() => {
    const maxAskSize =
      displayAsks.length > 0 ? Math.max(...displayAsks.map((l) => l.size), 0.01) : 0.01;
    const maxBidSize =
      displayBids.length > 0 ? Math.max(...displayBids.map((l) => l.size), 0.01) : 0.01;

    const totalAskVol = displayAsks.reduce((s, l) => s + l.size, 0);
    const totalBidVol = displayBids.reduce((s, l) => s + l.size, 0);
    const totalVol = totalAskVol + totalBidVol;

    return {
      globalMaxSize: Math.max(maxAskSize, maxBidSize),
      askVolPct: totalVol > 0 ? (totalAskVol / totalVol) * 100 : 0,
      bidVolPct: totalVol > 0 ? (totalBidVol / totalVol) * 100 : 0,
      totalAskVol,
      totalBidVol,
    };
  }, [displayAsks, displayBids]);

  return (
    <div
      id="order-book-dom"
      className="flex min-h-full flex-col rounded-none border-0 bg-surface font-sans text-[12.5px] select-none"
    >
      {/* ── Column Headers ──────────────────────────────────── */}
      <div className="grid shrink-0 grid-cols-3 gap-0 border-b border-border-default bg-elevated/30 px-3.5 py-2 text-[11px] font-extrabold text-text-muted uppercase tracking-wider font-sans">
        <div className="flex items-center gap-1.5">
          <span>Price</span>
          {isLive && (
            <span
              className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
              title="Live order flow connected"
            />
          )}
        </div>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* ── Ask Levels (Red) — 5-level Zerodha-style ladder ─────────── */}
      <div
        ref={asksScrollRef}
        className="flex flex-col flex-initial min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] font-sans"
      >
        <div className="mt-auto">
          {displayAsks.map((level, i) => {
            const isZero = level.price === 0;
            return (
              <div
                key={`ask-${i}`}
                className={`group relative grid grid-cols-3 gap-0 px-3.5 py-0.75 ${
                  isZero ? '' : 'hover:bg-red-500/10'
                }`}
              >
                {!isZero && (
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 bg-red-500/12"
                    style={{ width: `${depthPercent(level.size, globalMaxSize)}%` }}
                  />
                )}
                <span
                  className={`relative z-10 tabular-nums font-extrabold ${
                    isZero ? 'text-red-500/50 dark:text-red-400/40' : 'text-[#ef4444]'
                  }`}
                >
                  {level.price.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={`relative z-10 tabular-nums text-right font-bold ${
                    isZero ? 'text-text-muted/40' : 'text-red-400/90'
                  }`}
                >
                  {formatSize(level.size)}
                </span>
                <span
                  className={`relative z-10 tabular-nums text-right font-bold ${
                    isZero ? 'text-text-muted/30' : 'text-zinc-400'
                  }`}
                >
                  {formatSize(level.total)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mid Price / Spread Floating Pill Row ──────────── */}
      <OrderBookMidPill book={book} lastPrice={stats?.last_price ?? stats?.close} />

      {/* ── Bid Levels (Green) — 5-level Zerodha-style ladder ────────── */}
      <div className="flex flex-col flex-initial min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] font-sans">
        {displayBids.map((level, i) => {
          const isZero = level.price === 0;
          return (
            <div
              key={`bid-${i}`}
              className={`group relative grid grid-cols-3 gap-0 px-3.5 py-0.75 ${
                isZero ? '' : 'hover:bg-emerald-500/10'
              }`}
            >
              {!isZero && (
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 bg-emerald-500/12"
                  style={{ width: `${depthPercent(level.size, globalMaxSize)}%` }}
                />
              )}
              <span
                className={`relative z-10 tabular-nums font-extrabold ${
                  isZero ? 'text-emerald-500/50 dark:text-emerald-400/40' : 'text-bull'
                }`}
              >
                {level.price.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`relative z-10 tabular-nums text-right font-bold ${
                  isZero ? 'text-text-muted/40' : 'text-emerald-400/90'
                }`}
              >
                {formatSize(level.size)}
              </span>
              <span
                className={`relative z-10 tabular-nums text-right font-bold ${
                  isZero ? 'text-text-muted/30' : 'text-zinc-400'
                }`}
              >
                {formatSize(level.total)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Ask/Bid Volume Ratio Bar ────────────────────────── */}
      <OrderBookVolumeRatio
        bidVolPct={bidVolPct}
        askVolPct={askVolPct}
        totalBidVol={totalBidVol}
        totalAskVol={totalAskVol}
      />

      {/* ── Zerodha-style Market Depth Statistics Card ───────── */}
      <MarketDepthStats stats={stats} symbol={selectedSymbol} />
    </div>
  );
}
