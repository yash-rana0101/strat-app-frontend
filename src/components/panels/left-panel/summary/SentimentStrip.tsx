'use client';

import React from 'react';
import { Newspaper } from 'lucide-react';
import type { SentimentPayload } from '../../../../store/useQuantStore';
import SummaryStrip from './SummaryStrip';

export interface SentimentStripProps {
  /** The symbol currently on the chart — the subject the user believes they are reading about. */
  symbol?: string;
  sentiment: SentimentPayload | null;
  isLoading: boolean;
  error: string | null;
  onClick: () => void;
}

/** Where a -100..+100 score sits on a 0..100 track, with 50 as neutral. */
export function scoreToTrackPercent(score: number): number {
  const clamped = Math.max(-100, Math.min(100, score));
  return (clamped + 100) / 2;
}

function toneFor(score: number): { text: string; bar: string } {
  if (score > 0) return { text: 'text-bull', bar: 'bg-bull' };
  if (score < 0) return { text: 'text-bear', bar: 'bg-bear' };
  return { text: 'text-neutral', bar: 'bg-neutral' };
}

/**
 * The diverging gauge.
 *
 * One score, one bar, growing out of a centre line — NOT a pair of bullish /
 * bearish percentages. `SentimentPayload` carries a single `score`.
 */
function ScoreGauge({ score }: { score: number }) {
  const tone = toneFor(score);
  const trackPercent = scoreToTrackPercent(score);
  const magnitude = Math.abs(trackPercent - 50);
  const left = Math.min(50, trackPercent);

  return (
    <div className="flex items-center gap-1.5 w-full">
      <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted/70">Bear</span>
      <div
        role="meter"
        aria-valuenow={score}
        aria-valuemin={-100}
        aria-valuemax={100}
        aria-label="News sentiment score"
        className="relative h-1.5 flex-1 overflow-hidden rounded-full border border-border-default/50 bg-elevated/60"
      >
        <div
          className={`absolute top-0 h-full ${tone.bar}`}
          style={{ left: `${left}%`, width: `${magnitude}%` }}
        />
        {/* Neutral datum */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-px bg-text-muted/40" />
      </div>
      <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted/70">Bull</span>
    </div>
  );
}

export default function SentimentStrip({
  symbol,
  sentiment,
  isLoading,
  error,
  onClick,
}: SentimentStripProps) {
  const subject = sentiment?.symbol?.trim() ?? '';
  const subjectDiffers =
    !!subject && !!symbol?.trim() && subject.toUpperCase() !== symbol.trim().toUpperCase();

  const state = isLoading ? 'loading' : error ? 'error' : sentiment ? 'ready' : 'empty';

  const tone = sentiment ? toneFor(sentiment.score) : null;

  return (
    <SummaryStrip
      icon={<Newspaper size={16} />}
      label="AI News Sentiment"
      state={state}
      onClick={onClick}
      loadingMessage="Reading news"
      errorMessage={error ?? undefined}
      emptyMessage={symbol ? 'No reading' : 'Select a symbol'}
      badge={
        subjectDiffers && !isLoading ? (
          <span
            title={`No news is published about ${symbol}. This verdict is based on news about its underlying, ${subject}.`}
            className="inline-flex items-center rounded-md border border-border-default bg-elevated px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-wider text-text-muted"
          >
            on {subject}
          </span>
        ) : null
      }
      valueText={
        sentiment
          ? `${sentiment.label}, score ${sentiment.score > 0 ? 'plus ' : sentiment.score < 0 ? 'minus ' : ''}${Math.abs(sentiment.score)}${subjectDiffers ? `, based on news about ${subject}` : ''}`
          : undefined
      }
      value={
        sentiment && tone ? (
          <div className="flex items-center justify-between w-full">
            <span className={`text-sm font-black tabular-nums ${tone.text}`}>
              {sentiment.score > 0 ? '+' : ''}
              {sentiment.score}
            </span>
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider border ${
                sentiment.score > 0
                  ? 'border-bull/20 bg-bull/10 text-bull'
                  : sentiment.score < 0
                    ? 'border-bear/20 bg-bear/10 text-bear'
                    : 'border-border-default bg-elevated text-text-muted'
              }`}
            >
              {sentiment.label}
            </span>
          </div>
        ) : null
      }
      detail={sentiment ? <ScoreGauge score={sentiment.score} /> : null}
    />
  );
}
