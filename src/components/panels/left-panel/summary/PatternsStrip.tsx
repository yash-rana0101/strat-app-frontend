'use client';

import React from 'react';
import { Radio, Sparkles } from 'lucide-react';
import type { MultiTfChartPatterns } from '../../../../store/useQuantStore';
import {
  bestPatternTimeframe,
  formingPatternCount,
  patternCountFor,
  totalPatternCount,
} from '../patternsSummary';
import SummaryStrip from './SummaryStrip';

export interface PatternsStripProps {
  multiTfPatterns: MultiTfChartPatterns[] | null;
  isLoading: boolean;
  error: string | null;
  onClick: () => void;
}

export default function PatternsStrip({
  multiTfPatterns,
  isLoading,
  error,
  onClick,
}: PatternsStripProps) {
  const total = totalPatternCount(multiTfPatterns);
  const forming = formingPatternCount(multiTfPatterns);
  const bestTf = bestPatternTimeframe(multiTfPatterns);
  const bestTfCount = patternCountFor(multiTfPatterns, bestTf);

  const state = isLoading
    ? 'loading'
    : error
      ? 'error'
      : multiTfPatterns && total > 0
        ? 'ready'
        : 'empty';

  return (
    <SummaryStrip
      icon={<Sparkles size={16} />}
      label="Patterns"
      state={state}
      onClick={onClick}
      loadingMessage="Scanning"
      errorMessage={error ?? undefined}
      emptyMessage={multiTfPatterns ? 'None forming' : 'Not scanned'}
      valueText={
        total > 0
          ? `${total} pattern${total === 1 ? '' : 's'}${forming > 0 ? `, ${forming} still forming` : ''}, strongest on the ${bestTf} timeframe`
          : undefined
      }
      value={
        total > 0 ? (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5">
              <span className="text-sm font-black tabular-nums text-text-primary">{total}</span>
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-text-secondary">
                {total === 1 ? 'pattern' : 'patterns'}
              </span>
            </span>
            {forming > 0 && (
              <span
                title={`${forming} of ${total} still forming`}
                className="flex items-center gap-1 rounded-md border border-neutral/40 bg-neutral/12 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-neutral"
              >
                <Radio size={7} aria-hidden="true" />
                {forming}
              </span>
            )}
          </div>
        ) : null
      }
      detail={
        total > 0 ? (
          <p className="truncate text-[9px] leading-snug text-text-muted">
            Strongest on{' '}
            <span className="font-bold text-text-secondary">{bestTf}</span>
            {bestTfCount > 0 && <span> · {bestTfCount} there</span>}
          </p>
        ) : null
      }
    />
  );
}
