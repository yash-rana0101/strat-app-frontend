'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Gauge,
  Waves,
  BarChart3,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import type { ConsensusReport } from '../../../store/useQuantStore';

export interface ConfluenceMatrixProps {
  consensus: ConsensusReport | null;
  className?: string;
  compact?: boolean;
}

export default function ConfluenceMatrix({
  consensus,
  className = '',
  compact = false,
}: ConfluenceMatrixProps) {
  if (!consensus) return null;

  const {
    trend_score = 0,
    momentum_state = 'NORMAL',
    volatility_state = 'NORMAL',
    volume_flow_state = 'NORMAL',
    active_patterns = [],
    active_strategies = [],
  } = consensus;

  // Trend formatting
  const isTrendBullish = trend_score > 20;
  const isTrendBearish = trend_score < -20;
  const trendLabel = isTrendBullish
    ? `Bullish (+${trend_score})`
    : isTrendBearish
      ? `Bearish (${trend_score})`
      : `Neutral (${trend_score})`;

  const trendTone = isTrendBullish
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : isTrendBearish
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

  // State formatting helpers
  const getPillTone = (state: string) => {
    switch (state.toUpperCase()) {
      case 'OVERBOUGHT':
      case 'DISTRIBUTION':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
      case 'OVERSOLD':
      case 'ACCUMULATION':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
      case 'SQUEEZING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      case 'EXPANDING':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25';
      default:
        return 'text-text-secondary bg-elevated/60 border-border-default/50';
    }
  };

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 font-sans ${className}`}>
        {/* Trend Pill */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${trendTone}`}>
          {isTrendBullish ? <TrendingUp size={10} /> : isTrendBearish ? <TrendingDown size={10} /> : <Minus size={10} />}
          <span>{trendLabel}</span>
        </div>

        {/* Momentum Pill */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPillTone(momentum_state)}`}>
          <Gauge size={10} />
          <span>{momentum_state}</span>
        </div>

        {/* Volatility Pill */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${getPillTone(volatility_state)}`}>
          <Waves size={10} />
          <span>{volatility_state}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border-default/60 bg-elevated/20 p-3 shadow-sm font-sans ${className}`}>
      <div className="flex items-center justify-between border-b border-border-default/40 pb-2 mb-2.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
          <Layers size={11} className="text-text-muted" />
          Market Confluence Matrix
        </span>
        <span className="text-[8.5px] font-mono text-text-muted uppercase">
          Multi-Indicator Consensus
        </span>
      </div>

      {/* Indicator Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* 1. Trend Direction */}
        <div className="flex flex-col gap-1 rounded-lg border border-border-default/50 bg-surface/60 p-2">
          <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
            Trend Score
            {isTrendBullish ? <TrendingUp size={10} className="text-emerald-400" /> : isTrendBearish ? <TrendingDown size={10} className="text-rose-400" /> : <Minus size={10} className="text-amber-400" />}
          </span>
          <span className={`text-[10.5px] font-bold truncate ${isTrendBullish ? 'text-emerald-400' : isTrendBearish ? 'text-rose-400' : 'text-amber-400'}`}>
            {trendLabel}
          </span>
        </div>

        {/* 2. Momentum */}
        <div className="flex flex-col gap-1 rounded-lg border border-border-default/50 bg-surface/60 p-2">
          <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
            Momentum
            <Gauge size={10} className="text-cyan-400" />
          </span>
          <span className="text-[10.5px] font-bold text-text-primary truncate">
            {momentum_state}
          </span>
        </div>

        {/* 3. Volatility */}
        <div className="flex flex-col gap-1 rounded-lg border border-border-default/50 bg-surface/60 p-2">
          <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
            Volatility
            <Waves size={10} className="text-amber-400" />
          </span>
          <span className="text-[10.5px] font-bold text-text-primary truncate">
            {volatility_state}
          </span>
        </div>

        {/* 4. Volume Flow */}
        <div className="flex flex-col gap-1 rounded-lg border border-border-default/50 bg-surface/60 p-2">
          <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
            Volume Flow
            <BarChart3 size={10} className="text-emerald-400" />
          </span>
          <span className="text-[10.5px] font-bold text-text-primary truncate">
            {volume_flow_state}
          </span>
        </div>
      </div>

      {/* Active Patterns & Strategies Tags */}
      {(active_patterns.length > 0 || active_strategies.length > 0) && (
        <div className="mt-2.5 pt-2 border-t border-border-default/30 flex flex-wrap items-center gap-1">
          <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted mr-1">
            Formations:
          </span>
          {active_patterns.map((p, idx) => (
            <span
              key={`pat-${idx}`}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8.5px] font-semibold bg-elevated border border-border-default/60 text-text-secondary"
            >
              <CheckCircle2 size={9} className="text-emerald-400 shrink-0" />
              {p.pattern_type.replace(/_/g, ' ')}
              {(typeof p === 'string' ? p : (p as { pattern_type?: string }).pattern_type || '').replace(/_/g, ' ')}
            </span>
          ))}
          {active_strategies.map((s, idx) => (
            <span
              key={`strat-${idx}`}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8.5px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
            >
              {s.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
