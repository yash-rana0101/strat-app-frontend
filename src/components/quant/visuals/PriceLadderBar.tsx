'use client';

import React from 'react';
import { TrendingUp, TrendingDown, ShieldAlert, Target } from 'lucide-react';

export interface PriceLadderBarProps {
  entry: number;
  target: number;
  stopLoss: number;
  side?: 'BUY' | 'SELL';
  currentPrice?: number;
  compact?: boolean;
  className?: string;
}

export default function PriceLadderBar({
  entry,
  target,
  stopLoss,
  side = 'BUY',
  currentPrice,
  compact = false,
  className = '',
}: PriceLadderBarProps) {
  const isBuy = side === 'BUY';

  // Distances in points
  const riskPts = Math.abs(entry - stopLoss);
  const rewardPts = Math.abs(target - entry);

  // Distances in percentage
  const riskPct = entry > 0 ? ((riskPts / entry) * 100).toFixed(1) : '0.0';
  const rewardPct = entry > 0 ? ((rewardPts / entry) * 100).toFixed(1) : '0.0';

  // Risk to reward ratio
  const rrRatio = riskPts > 0 ? (rewardPts / riskPts).toFixed(1) : '—';
  const isHealthyRr = Number(rrRatio) >= 1.5;

  // Proportional bar width (between risk and reward)
  const totalSpan = riskPts + rewardPts;
  const riskWidthPct = totalSpan > 0 ? Math.max(15, Math.min(85, (riskPts / totalSpan) * 100)) : 33;
  const rewardWidthPct = 100 - riskWidthPct;

  if (compact) {
    return (
      <div className={`flex flex-col gap-1.5 font-sans ${className}`}>
        {/* Metric Header */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold uppercase tracking-wider text-text-muted text-[8.5px]">
            Execution Ladder
          </span>
          <span
            className={`font-mono text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
              isHealthyRr
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
            }`}
          >
            1 : {rrRatio} R:R
          </span>
        </div>

        {/* Proportional visual bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border-default/40 flex shadow-inner">
          <div
            style={{ width: `${riskWidthPct}%` }}
            className="h-full bg-gradient-to-r from-rose-600 to-rose-500"
            title={`Stop Loss Risk: -${riskPct}%`}
          />
          <div
            style={{ width: `${rewardWidthPct}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            title={`Take Profit Reward: +${rewardPct}%`}
          />
        </div>

        {/* 3 Price milestones (No nested boxes) */}
        <div className="grid grid-cols-3 divide-x divide-border-default/30 text-center pt-1 font-mono">
          <div className="flex flex-col px-1">
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-rose-400/80">
              SL (-{riskPct}%)
            </span>
            <span className="text-rose-400 font-bold text-[11px]">₹{stopLoss.toFixed(2)}</span>
          </div>
          <div className="flex flex-col px-1">
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-text-muted">
              Entry ({side})
            </span>
            <span className="text-text-primary font-bold text-[11px]">₹{entry.toFixed(2)}</span>
          </div>
          <div className="flex flex-col px-1">
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-emerald-400/80">
              Target (+{rewardPct}%)
            </span>
            <span className="text-emerald-400 font-bold text-[11px]">₹{target.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full / Expanded Variant — Unboxed, flat, sleek institutional design (NO nested boxes)
  return (
    <div className={`flex flex-col gap-2 font-sans select-none ${className}`}>
      {/* Top Header Row (No box) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono">
            Execution Ladder
          </span>
          <span className="text-[9px] text-text-muted/60">
            • {isBuy ? 'Long Payoff' : 'Short Payoff'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[9.5px]">
          <span className="text-text-muted text-[8px] uppercase tracking-widest">R:R</span>
          <span
            className={`font-bold px-1.5 py-0.2 rounded border ${
              isHealthyRr
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
            }`}
          >
            1 : {rrRatio}
          </span>
        </div>
      </div>

      {/* Visual Payoff Slider Bar */}
      <div className="space-y-1">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-border-default/40 flex shadow-inner">
          <div
            style={{ width: `${riskWidthPct}%` }}
            className="h-full bg-gradient-to-r from-rose-600 to-rose-500"
          />
          {/* Entry Divider Pin */}
          <div className="w-0.5 h-full bg-white z-10" />
          <div
            style={{ width: `${rewardWidthPct}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          />
        </div>

        <div className="flex justify-between text-[8.5px] font-mono font-medium text-text-muted px-0.5">
          <span className="text-rose-400 flex items-center gap-1">
            <ShieldAlert size={9} />
            Risk: -₹{riskPts.toFixed(2)} (-{riskPct}%)
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Target size={9} />
            Target: +₹{rewardPts.toFixed(2)} (+{rewardPct}%)
          </span>
        </div>
      </div>

      {/* 3 Metric Columns — Divided, flat, NO nested boxes */}
      <div className="grid grid-cols-3 divide-x divide-border-default/30 pt-1 text-center font-mono">
        {/* Stop Loss Column */}
        <div className="flex flex-col gap-0.5 px-2 text-left">
          <span className="text-[8px] font-bold uppercase tracking-wider text-rose-400/90">
            Stop Loss
          </span>
          <span className="text-sm font-extrabold text-rose-400">
            ₹{stopLoss.toFixed(2)}
          </span>
          <span className="text-[8px] text-rose-400/70">-{riskPct}% risk</span>
        </div>

        {/* Entry Column */}
        <div className="flex flex-col gap-0.5 px-2 text-center">
          <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted">
            Entry ({side})
          </span>
          <span className="text-sm font-extrabold text-text-primary">
            ₹{entry.toFixed(2)}
          </span>
          <span className="text-[8px] text-text-muted">
            {currentPrice ? `LTP: ₹${currentPrice.toFixed(2)}` : 'Planned Level'}
          </span>
        </div>

        {/* Target Column */}
        <div className="flex flex-col gap-0.5 px-2 text-right">
          <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400/90">
            Take Profit
          </span>
          <span className="text-sm font-extrabold text-emerald-400">
            ₹{target.toFixed(2)}
          </span>
          <span className="text-[8px] text-emerald-400/70">+{rewardPct}% target</span>
        </div>
      </div>
    </div>
  );
}
