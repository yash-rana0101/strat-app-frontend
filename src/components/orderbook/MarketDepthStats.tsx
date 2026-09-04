'use client';

import React from 'react';
import type { MarketDepthStatsData } from './marketDepthTypes';

interface MarketDepthStatsProps {
  stats: MarketDepthStatsData | null;
  symbol?: string;
}

function formatPrice(val?: number | null): string {
  if (val == null || !Number.isFinite(val) || val <= 0) return 'N/A';
  return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(val?: number | null): string {
  if (val == null || !Number.isFinite(val) || val < 0) return '0';
  return Math.round(val).toLocaleString('en-IN');
}

function formatTimestamp(ts?: string | null): string {
  if (ts && ts.trim()) {
    const trimmed = ts.trim();
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  }
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function MarketDepthStats({ stats }: MarketDepthStatsProps) {
  const low = stats?.low ?? null;
  const high = stats?.high ?? null;
  const open = stats?.open ?? null;
  const close = stats?.close ?? null;
  const ltp = stats?.last_price ?? stats?.average_price ?? close ?? open ?? 0;

  // Day's range bar percentage calculation
  let ltpPct = 50;
  if (low != null && high != null && high > low && ltp != null && ltp >= low && ltp <= high) {
    ltpPct = ((ltp - low) / (high - low)) * 100;
  } else if (low != null && high != null && high > low && ltp != null) {
    ltpPct = Math.max(0, Math.min(100, ((ltp - low) / (high - low)) * 100));
  }

  const isBullish = close != null && ltp >= close;
  const rangeColor = isBullish ? 'bg-emerald-500' : 'bg-rose-400';

  // Circuit limits fallback (10% standard equity band if broker omits)
  const lowerCircuit =
    stats?.lower_circuit_limit ??
    (close != null && close > 0 ? close * 0.9 : null);
  const upperCircuit =
    stats?.upper_circuit_limit ??
    (close != null && close > 0 ? close * 1.1 : null);

  const avgPrice = stats?.average_price ?? ltp;
  const refPrice = stats?.ref_price ?? close ?? open;

  return (
    <div className="shrink-0 border-t border-border-default/60 bg-surface/50 px-3.5 py-3 font-sans text-text-primary select-none">
      {/* ── OHLC Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-center justify-between text-[11.5px]">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Open</span>
            <span className="font-semibold tabular-nums">{formatPrice(open)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Prev. Close</span>
            <span className="font-semibold tabular-nums">{formatPrice(close)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11.5px]">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Low</span>
            <span className="font-semibold tabular-nums">{formatPrice(low)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted">High</span>
            <span className="font-semibold tabular-nums">{formatPrice(high)}</span>
          </div>
        </div>

        {/* ── Day's Range Track & Marker ─────────────────────────────── */}
        <div className="relative w-full pt-1.5 pb-2">
          {/* Background track */}
          <div className="relative h-[2px] w-full rounded-full bg-zinc-700/80">
            {/* Active range bar */}
            <div
              className={`absolute top-0 left-0 h-full rounded-full ${rangeColor} transition-all duration-300`}
              style={{ width: `${ltpPct}%` }}
            />
            {/* Current LTP circle dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-zinc-300 border border-zinc-900 shadow-sm transition-all duration-300"
              style={{ left: `${ltpPct}%` }}
              title={`LTP: ${formatPrice(ltp)}`}
            />
          </div>
          {/* Low marker triangle */}
          <span className="absolute bottom-0.5 left-0 text-[7px] text-zinc-500 leading-none">
            ▲
          </span>
        </div>
      </div>

      {/* ── 2-Column Market Stats Grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-[11px] pt-1">
        {/* Row 1 */}
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Volume</span>
          <span className="font-medium tabular-nums">{formatVolume(stats?.volume)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Avg. price</span>
          <span className="font-medium tabular-nums">{formatPrice(avgPrice)}</span>
        </div>

        {/* Row 2 */}
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Lower circuit</span>
          <span className="font-medium tabular-nums">{formatPrice(lowerCircuit)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Upper circuit</span>
          <span className="font-medium tabular-nums">{formatPrice(upperCircuit)}</span>
        </div>

        {/* Row 3 */}
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Ref. price</span>
          <span className="font-medium tabular-nums">{formatPrice(refPrice)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Indicative close</span>
          <span className="font-medium tabular-nums">
            {stats?.indicative_close != null ? formatPrice(stats.indicative_close) : 'N/A'}
          </span>
        </div>

        {/* Row 4 */}
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Total imbalance</span>
          <span className="font-medium tabular-nums">
            {stats?.total_imbalance != null ? stats.total_imbalance : 0}
          </span>
        </div>
        <div className="flex items-center justify-between" aria-hidden="true" />

        {/* Row 5 */}
        <div className="flex items-center justify-between">
          <span className="text-text-muted">LTQ</span>
          <span className="font-medium tabular-nums">{stats?.last_quantity ?? 1}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">LTT</span>
          <span className="font-medium tabular-nums text-[10px] text-zinc-300">
            {formatTimestamp(stats?.last_trade_time)}
          </span>
        </div>
      </div>
    </div>
  );
}

