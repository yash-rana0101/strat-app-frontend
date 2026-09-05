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
            Risk : Reward
          </span>
          <span
            className={`font-mono text-[10px] font-black px-1.5 py-0.5 rounded border ${
              isHealthyRr
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            1 : {rrRatio} R:R
          </span>
        </div>

        {/* Proportional visual bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-border-default/30 flex shadow-inner">
          <div
            style={{ width: `${riskWidthPct}%` }}
            className="h-full bg-gradient-to-r from-rose-500/80 to-rose-500"
            title={`Stop Loss Risk: -${riskPct}%`}
          />
          <div
            style={{ width: `${rewardWidthPct}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            title={`Take Profit Reward: +${rewardPct}%`}
          />
        </div>

        {/* 3 Price milestones */}
        <div className="flex items-center justify-between text-[9.5px] font-mono font-bold">
          <div className="flex flex-col text-left">
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-text-muted">
              SL (-{riskPct}%)
            </span>
            <span className="text-rose-400">₹{stopLoss.toFixed(2)}</span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-text-muted">
              Entry
            </span>
            <span className="text-text-primary">₹{entry.toFixed(2)}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-text-muted">
              Target (+{rewardPct}%)
            </span>
            <span className="text-emerald-400">₹{target.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full / Expanded Variant (for Agent Detail & Actionable Trade Plan)
  return (
    <div
      className={`rounded-xl border border-border-default/60 bg-elevated/20 p-3.5 shadow-sm font-sans ${className}`}
    >
      {/* Top Level Bar Header */}
      <div className="flex items-center justify-between border-b border-border-default/40 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-md ${
              isBuy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {isBuy ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-text-primary">
              Execution Ladder
            </span>
            <span className="block text-[8.5px] text-text-muted">
              {isBuy ? 'Long Setup Payoff Matrix' : 'Short Setup Payoff Matrix'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
              Risk/Reward
            </span>
            <span
              className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${
                isHealthyRr
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-xs shadow-emerald-500/10'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
              }`}
            >
              1 : {rrRatio}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Payoff Slider Bar */}
      <div className="space-y-1.5 my-3">
        <div className="flex justify-between text-[9px] font-mono font-semibold text-text-muted px-0.5">
          <span className="text-rose-400 flex items-center gap-1">
            <ShieldAlert size={10} />
            Risk: -₹{riskPts.toFixed(2)} (-{riskPct}%)
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Target size={10} />
            Target: +₹{rewardPts.toFixed(2)} (+{rewardPct}%)
          </span>
        </div>

        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface border border-border-default/50 flex shadow-inner">
          <div
            style={{ width: `${riskWidthPct}%` }}
            className="h-full bg-gradient-to-r from-rose-600/80 to-rose-500 relative group"
          />
          {/* Entry Divider Pin */}
          <div className="w-1 h-full bg-white z-10 shadow-md shadow-white/50" />
          <div
            style={{ width: `${rewardWidthPct}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 relative group"
          />
        </div>
      </div>

      {/* 3 Prominent Metric Cards */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {/* Stop Loss Card */}
        <div className="flex flex-col gap-0.5 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5">
          <span className="text-[8px] font-bold uppercase tracking-widest text-rose-400/90">
            Stop Loss
          </span>
          <span className="font-mono text-sm font-extrabold text-rose-400">
            ₹{stopLoss.toFixed(2)}
          </span>
          <span className="font-mono text-[8.5px] text-rose-400/70">-{riskPct}% risk</span>
        </div>

        {/* Entry Card */}
        <div className="flex flex-col gap-0.5 rounded-lg border border-border-default bg-surface/80 p-2.5">
          <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
            Entry ({side})
          </span>
          <span className="font-mono text-sm font-extrabold text-text-primary">
            ₹{entry.toFixed(2)}
          </span>
          <span className="text-[8.5px] text-text-muted">
            {currentPrice ? `LTP: ₹${currentPrice.toFixed(2)}` : 'Planned Level'}
          </span>
        </div>

        {/* Target Card */}
        <div className="flex flex-col gap-0.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
          <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/90">
            Take Profit
          </span>
          <span className="font-mono text-sm font-extrabold text-emerald-400">
            ₹{target.toFixed(2)}
          </span>
          <span className="font-mono text-[8.5px] text-emerald-400/70">+{rewardPct}% upside</span>
        </div>
      </div>
    </div>
  );
}
