'use client';

import React from 'react';
import type { AnalysisTab } from '../AnalysisSheet';
import type {
  ConsensusReport,
  MultiTfChartPatterns,
  SentimentPayload,
} from '../../../../store/useQuantStore';
import SentimentStrip from './SentimentStrip';
import TechnicalStrip from './TechnicalStrip';
import PatternsStrip from './PatternsStrip';

export interface SummaryRailProps {
  symbol?: string;
  onOpen: (tab: AnalysisTab) => void;

  sentiment: SentimentPayload | null;
  isSentimentLoading: boolean;
  sentimentError: string | null;

  consensus: ConsensusReport | null;
  consensusComputedAt: number | null;

  multiTfPatterns: MultiTfChartPatterns[] | null;
  isPatternsLoading: boolean;
  patternsError: string | null;
}

/**
 * The three analytical readings, cleanly formatted as modular summary cards,
 * pinned below the watchlist.
 */
export default function SummaryRail({
  symbol,
  onOpen,
  sentiment,
  isSentimentLoading,
  sentimentError,
  consensus,
  consensusComputedAt,
  multiTfPatterns,
  isPatternsLoading,
  patternsError,
}: SummaryRailProps) {
  return (
    <div
      data-tour="analysis-summary"
      aria-label="Analysis summary"
      className="shrink-0 border-t border-border-default bg-surface pb-2"
    >
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-2">
        <span className="text-[9.5px] font-black uppercase tracking-wider text-text-muted/80">
          AI Analysis
        </span>
        <span className="h-px flex-1 bg-border-default/50" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5 px-2">
        <SentimentStrip
          symbol={symbol}
          sentiment={sentiment}
          isLoading={isSentimentLoading}
          error={sentimentError}
          onClick={() => onOpen('sentiment')}
        />

        <TechnicalStrip
          symbol={symbol}
          consensus={consensus}
          computedAt={consensusComputedAt}
          onClick={() => onOpen('technical')}
        />

        <PatternsStrip
          multiTfPatterns={multiTfPatterns}
          isLoading={isPatternsLoading}
          error={patternsError}
          onClick={() => onOpen('patterns')}
        />
      </div>
    </div>
  );
}
