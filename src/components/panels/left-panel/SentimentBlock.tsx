'use client';

import React from 'react';
import { Newspaper, Loader2 } from 'lucide-react';
import type { SentimentPayload } from '../../../store/useQuantStore';
import SentimentSkeleton from './SentimentSkeleton';
import SentimentHeroCard from './sentiment/SentimentHeroCard';
import SentimentNewsList from './sentiment/SentimentNewsList';

interface SentimentBlockProps {
  sentiment: SentimentPayload | null;
  isLoading: boolean;
  error: string | null;
  /**
   * The symbol currently on the chart. Used only to decide whether the verdict
   * has to name its own subject — see `subjectDiffers` below.
   */
  symbol?: string;
  /**
   * Where this block is rendered.
   *
   * `panel` is the historical 224px sidebar layout and remains the default so
   * existing call sites are untouched. `sheet` is the detail view, which has room
   * to show the headline list without asking for a click first.
   */
  variant?: 'panel' | 'sheet';
}

export default function SentimentBlock({
  sentiment,
  isLoading,
  error,
  symbol,
  variant = 'panel',
}: SentimentBlockProps) {
  const inSheet = variant === 'sheet';

  // An option contract has no news of its own, so the store looks up its
  // underlying instead (`sentimentSubject` in useQuantStore). Rendering
  // RELIANCE's headlines under the heading RELIANCE26AUG1290CE without saying so
  // would silently attribute one instrument's news to another, so name the
  // subject whenever it is not the symbol the user is looking at.
  const subject = sentiment?.symbol?.trim() ?? '';
  const subjectDiffers =
    !!subject && !!symbol?.trim() && subject.toUpperCase() !== symbol.trim().toUpperCase();

  return (
    <div
      className={`flex flex-col gap-3 ${
        inSheet ? 'p-4' : 'px-3 py-2.5 border-b border-border-default'
      }`}
    >
      {/* ── Subheader ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <Newspaper size={inSheet ? 13 : 10} className="text-text-muted" />
        {/* In the sheet the dialog header already names the section; repeating it
            here would give the same view two titles. */}
        {!inSheet && (
          <h3 className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
            AI News Sentiment
          </h3>
        )}
        {subjectDiffers && !isLoading && (
          <span
            title={`No news is published about ${symbol}. This verdict is based on news about its underlying, ${subject}.`}
            className="inline-flex items-center rounded-md border border-border-default bg-elevated px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-wider text-text-muted"
          >
            on {subject}
          </span>
        )}
        {isLoading && (
          <Loader2 size={10} className="ml-auto animate-spin text-text-muted" />
        )}
        {sentiment && !isLoading && (
          <span
            className={`ml-auto ${
              inSheet ? 'text-[11px]' : 'text-[8px]'
            } text-text-muted tabular-nums`}
          >
            {sentiment.headlines.length} headlines
          </span>
        )}
      </div>

      {isLoading ? (
        <SentimentSkeleton />
      ) : error ? (
        <div
          className={`flex items-center gap-2 rounded-lg py-2.5 px-3 bg-rose-500/10 border border-rose-500/25`}
        >
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
          {/* In the sheet the message wraps instead of truncating: this is the
              only place the failure is explained in full. */}
          <p
            className={`text-xs text-rose-300/90 font-medium ${
              inSheet ? 'break-words' : 'truncate'
            }`}
          >
            {error}
          </p>
        </div>
      ) : sentiment ? (
        <div className="flex flex-col gap-3.5">
          <SentimentHeroCard sentiment={sentiment} inSheet={inSheet} />
          <SentimentNewsList sentiment={sentiment} inSheet={inSheet} />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg py-3 px-3 bg-elevated/30 border border-border-default/60">
          <div className="h-1.5 w-1.5 rounded-full bg-border-default animate-pulse motion-reduce:animate-none" />
          <p className="text-xs text-text-muted/70 italic">Select a symbol to load sentiment</p>
        </div>
      )}
    </div>
  );
}
