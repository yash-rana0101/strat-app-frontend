'use client';

import React, { useMemo } from 'react';
import { Eye, Activity } from 'lucide-react';

import { useFqReasoningSteps, useFqSessionStatus } from '../useFqSession';
import { useFqHeartbeatInfo } from '../useFqHeartbeat';
import { useTradeStore } from '../../../store/useTradeStore';
import { useLiveTickPrices } from '../../../hooks/useLiveTickPrices';
import {
  computeWatchBands,
  extractWatchCondition,
  formatTimeAgo,
  type WatchingIndicatorProps,
} from './watchConditionHelper';

export type { WatchingIndicatorProps };

export default function WatchingIndicator(props: WatchingIndicatorProps = {}) {
  const steps = useFqReasoningSteps();
  const sessionStatus = useFqSessionStatus();
  const fqHb = useFqHeartbeatInfo();
  const selectedSymbol = useTradeStore((s) => s.selectedSymbol);
  const activeTimeframe = useTradeStore((s) => s.activeTimeframe);
  const ohlcCandles = useTradeStore((s) => s.ohlcCandles);
  const watchlist = useTradeStore((s) => s.watchlist);
  const liveTicks = useLiveTickPrices();

  const heartbeatCount = props.heartbeatCount ?? fqHb.heartbeatCount;
  const lastHeartbeatAt =
    props.lastHeartbeatAt !== undefined ? props.lastHeartbeatAt : fqHb.lastHeartbeatAt;
  const lastHeartbeatStatus = props.lastHeartbeatStatus ?? fqHb.lastHeartbeatStatus;

  const extracted = useMemo(() => extractWatchCondition(steps), [steps]);

  const targetSymbol = props.symbol ?? extracted?.symbol ?? selectedSymbol ?? 'RELIANCE';
  const timeframe = props.timeframe ?? extracted?.timeframe ?? activeTimeframe;
  const direction: 'above' | 'below' =
    (props.direction
      ? String(props.direction).toLowerCase().includes('below') ||
        String(props.direction).toLowerCase().includes('down')
        ? 'below'
        : 'above'
      : extracted?.direction) ?? 'above';

  const triggerPrice = props.priceLevel ?? extracted?.priceLevel ?? null;
  const invalidationPrice = props.invalidationLevel ?? extracted?.invalidationLevel ?? null;
  const volumeMultiplier = props.volumeMultiplier ?? extracted?.volumeMultiplier ?? null;

  // Resolve current price
  const candlePrice = ohlcCandles.find((c) => c.symbol === targetSymbol)?.close;
  const watchlistPrice = watchlist.find((w) => w.symbol === targetSymbol)?.lastPrice;
  const tickPrice = liveTicks.get(targetSymbol)?.price;
  const currentPrice =
    props.currentPrice ?? tickPrice ?? candlePrice ?? (watchlistPrice || null);

  const {
    floorPrice,
    ceilingPrice,
    floorPct,
    triggerPct,
    ceilingPct,
    currentPct,
    distanceAway,
    distancePct,
  } = computeWatchBands(direction, triggerPrice, invalidationPrice, currentPrice);

  return (
    <div className="flex justify-start animate-fade-in font-sans w-full my-2 select-none">
      {/* Golden container: clean, simple, minimal border and tint. NO glowing ambient pulse or shadows */}
      <div className="w-full rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={12} className="text-amber-400 shrink-0" />
            <span className="text-[10.5px] font-bold font-mono uppercase tracking-wider text-text-primary">
              AI WATCHER ACTIVE
            </span>
            {targetSymbol && (
              <span className="text-[9.5px] font-mono text-text-muted">
                • {targetSymbol} {timeframe ? `(${timeframe})` : ''}
              </span>
            )}
          </div>

          {/* Simple minimal LIVE badge (no glowing blur shadow, no ping) */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-[9px] font-mono font-bold tracking-widest">LIVE</span>
          </div>
        </div>

        {/* Price Target Boundaries with REAL price data */}
        <div className="mt-2.5 pt-2 border-t border-amber-500/15 flex flex-col gap-2">
          <div className="grid grid-cols-3 items-end text-left">
            {/* Left: Floor Band */}
            <div>
              <span className="text-[8.5px] font-mono text-text-muted uppercase block">
                {direction === 'above' && invalidationPrice ? 'Invalidation' : 'Floor Band'}
              </span>
              <span className="text-[10.5px] font-mono font-semibold text-text-secondary">
                {floorPrice ? `₹${floorPrice.toFixed(2)}` : '—'}
              </span>
            </div>

            {/* Center: Trigger Zone */}
            <div className="text-center">
              <span className="text-[8.5px] font-mono text-amber-400/90 font-semibold uppercase tracking-wider block">
                {direction === 'below' ? 'Trigger (Breakdown)' : 'Trigger (Breakout)'}
              </span>
              <span className="text-[11.5px] font-mono font-bold text-amber-400">
                {triggerPrice ? `₹${triggerPrice.toFixed(2)}` : 'Awaiting level'}
              </span>
            </div>

            {/* Right: Ceiling Band */}
            <div className="text-right">
              <span className="text-[8.5px] font-mono text-text-muted uppercase block">
                {direction === 'below' && invalidationPrice ? 'Invalidation' : 'Ceiling Band'}
              </span>
              <span className="text-[10.5px] font-mono font-semibold text-text-secondary">
                {ceilingPrice ? `₹${ceilingPrice.toFixed(2)}` : '—'}
              </span>
            </div>
          </div>

          {/* Clean minimal boundary track: NO glowing pulse, NO scanlines */}
          <div className="h-1.5 w-full rounded-full bg-elevated/80 border border-border-default/40 overflow-hidden relative">
            {/* Minimal static shaded trigger range */}
            <div
              className="absolute inset-y-0 rounded-full bg-amber-500/30"
              style={{
                left: `${Math.min(floorPct, triggerPct)}%`,
                right: `${Math.max(0, 100 - Math.max(ceilingPct, triggerPct))}%`,
              }}
            />
            {/* Clean marker for current price */}
            {currentPrice != null && currentPct != null && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-text-primary rounded-full"
                style={{ left: `${Math.max(2, Math.min(98, currentPct))}%` }}
                title={`LTP: ₹${currentPrice.toFixed(2)}`}
              />
            )}
          </div>

          {/* Bottom details row: Condition & LTP */}
          <div className="flex items-center justify-between text-[9px] font-mono text-text-muted pt-0.5">
            <span className="truncate">
              Condition:{' '}
              <span className="text-text-secondary font-medium">
                {triggerPrice
                  ? `Price ${direction === 'below' ? '≤' : '≥'} ₹${triggerPrice.toFixed(2)}`
                  : 'Monitoring ticker'}
              </span>
              {volumeMultiplier ? ` • Vol ≥ ${volumeMultiplier}x` : ''}
            </span>

            {currentPrice ? (
              <span className="shrink-0 ml-2">
                LTP:{' '}
                <span className="text-text-primary font-bold">
                  {`₹${currentPrice.toFixed(2)}`}
                </span>
                {distanceAway != null && (
                  <span className="text-amber-400/90 ml-1">
                    {`(₹${Math.abs(distanceAway).toFixed(2)}${distancePct ? ` / ${distancePct}%` : ''} away)`}
                  </span>
                )}
              </span>
            ) : null}
          </div>

          {/* Heartbeat Status Row */}
          <div className="mt-1.5 pt-1.5 border-t border-amber-500/15 flex items-center justify-between text-[9px] font-mono">
            <div className="flex items-center gap-1.5 min-w-0">
              <Activity size={10} className="text-amber-400 shrink-0" />
              <span className="font-semibold text-text-primary">
                Heartbeat:
              </span>
              <span className="text-text-muted truncate">
                {heartbeatCount > 0
                  ? `Pulse #${heartbeatCount}${lastHeartbeatAt ? ` (${formatTimeAgo(lastHeartbeatAt)})` : ''}`
                  : 'Active • Background monitor engaged'}
              </span>
            </div>

            <div className="shrink-0 ml-2 text-right">
              <span
                className={
                  sessionStatus === 'running'
                    ? 'text-amber-400 font-semibold'
                    : 'text-emerald-400 font-medium'
                }
              >
                {sessionStatus === 'running'
                  ? 'Re-checking setup...'
                  : (lastHeartbeatStatus || 'Thesis holding')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
