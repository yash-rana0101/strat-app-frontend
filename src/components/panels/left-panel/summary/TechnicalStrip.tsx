'use client';

import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import type { ConsensusReport } from '../../../../store/useQuantStore';
import {
  CONSENSUS_STALE_AFTER_MS,
  consensusMatchesSymbol,
  formatAge,
  trendBg,
  trendColor,
  trendGaugePercent,
  trendVerdict,
} from '../consensusView';
import SummaryStrip from './SummaryStrip';

export interface TechnicalStripProps {
  symbol?: string | null;
  consensus: ConsensusReport | null;
  /** When `consensus` was computed (epoch ms), or null if unknown. */
  computedAt?: number | null;
  onClick: () => void;
  /** Injectable clock, so the staleness boundary is testable without faking timers. */
  now?: number;
}

export default function TechnicalStrip({
  symbol,
  consensus,
  computedAt,
  onClick,
  now,
}: TechnicalStripProps) {
  const matches = consensus ? consensusMatchesSymbol(consensus.symbol, symbol) : false;
  const report = matches ? consensus : null;

  const [tick, setTick] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!computedAt || now !== undefined) return;
    const id = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [computedAt, now]);

  const clock = now ?? tick;
  const ageMs = report && computedAt ? Math.max(0, clock - computedAt) : null;
  const isStale = ageMs !== null && ageMs > CONSENSUS_STALE_AFTER_MS;

  if (!report) {
    return (
      <SummaryStrip
        icon={<TrendingUp size={16} />}
        label="Technical Consensus"
        state="empty"
        emptyMessage="Run Strat AI Agent"
        onClick={onClick}
      />
    );
  }

  const score = report.trend_score;
  const verdict = trendVerdict(score);

  return (
    <SummaryStrip
      icon={<TrendingUp size={16} />}
      label="Technical Consensus"
      onClick={onClick}
      badge={
        isStale ? (
          <span
            title={
              computedAt
                ? `Computed at ${new Date(computedAt).toLocaleTimeString()}. Re-run analysis to refresh.`
                : undefined
            }
            className="inline-flex items-center gap-1 rounded-md border border-neutral/40 bg-neutral/10 px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-wider text-neutral"
          >
            <AlertTriangle size={8} aria-hidden="true" />
            {ageMs !== null ? formatAge(ageMs) : 'stale'}
          </span>
        ) : null
      }
      valueText={`${verdict}, score ${score > 0 ? 'plus ' : score < 0 ? 'minus ' : ''}${Math.abs(score)}${isStale && ageMs !== null
          ? `, previous reading from ${formatAge(ageMs)}`
          : ageMs !== null
            ? `, measured ${formatAge(ageMs)}`
            : ''
        }`}
      value={
        <div className="flex items-center justify-between w-full">
          <span className={`text-sm font-black tabular-nums ${trendColor(score)}`}>
            {score > 0 ? '+' : ''}
            {score}
          </span>
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider border border-current/20 ${trendBg(score)}/10 ${trendColor(score)}`}
          >
            {verdict}
          </span>
        </div>
      }
      detail={
        <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-border-default/50 bg-elevated/60">
          <div
            className={`h-full ${trendBg(score)} ${isStale ? 'opacity-50' : ''}`}
            style={{ width: `${trendGaugePercent(score)}%` }}
          />
          {/* Neutral datum */}
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-px bg-text-muted/40" />
        </div>
      }
    />
  );
}
