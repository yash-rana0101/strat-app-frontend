'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ChartPattern } from '../../../store/useQuantStore';
import {
  CONFIDENCE_BAND_OPACITY,
  MUTED_TAG,
  breakoutTag,
  confidenceBand,
  patternSentiment,
  sentimentTheme,
  volumeTag,
} from './patternStyles';

export interface PatternCardProps {
  pattern: ChartPattern;
  index: number;
  inSheet: boolean;
  onClick: (pattern: ChartPattern) => void;
}

export default function PatternCard({
  pattern: p,
  index: idx,
  inSheet,
  onClick,
}: PatternCardProps) {
  const sentiment = patternSentiment(p.sentiment);
  const tone = sentimentTheme(sentiment);
  const isBullish = sentiment === 'bullish';
  const isBearish = sentiment === 'bearish';
  const isForming = p.is_forming ?? false;
  const rawProgress = p.formation_progress ?? 0;
  const progress = rawProgress > 1 ? rawProgress / 100 : rawProgress;
  const progressPct = Math.min(100, Math.max(0, Math.round(progress * 100)));

  const rawConf = p.confidence ?? 0;
  const conf = rawConf > 1 ? rawConf / 100 : rawConf;
  const confPct = Math.min(100, Math.max(0, Math.round(conf * 100)));
  const confOpacity = CONFIDENCE_BAND_OPACITY[confidenceBand(conf)];

  const key = `${p.pattern_type}-${p.start_idx}-${p.end_idx}-${idx}`;

  return (
    <div
      key={key}
      role="button"
      tabIndex={0}
      aria-label={`${p.pattern_type}, ${p.sentiment}${isForming ? `, forming ${progressPct}%` : ''}, confidence ${confPct}%`}
      onClick={() => onClick(p)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(p);
        }
      }}
      className="
        group relative flex flex-col gap-2.5 rounded-xl border border-border-default/50
        bg-elevated/25 p-3.5 text-left transition-all duration-150
        hover:bg-elevated/60 hover:border-border-default shadow-sm cursor-pointer
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary
      "
    >
      {/* ── Top Header: Direction Icon + Pattern Name + Status Badges ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`shrink-0 ${tone.text}`}>
            {isBullish ? (
              <TrendingUp size={15} />
            ) : isBearish ? (
              <TrendingDown size={15} />
            ) : (
              <Minus size={15} />
            )}
          </span>
          <span className="text-xs font-bold text-text-primary tracking-tight truncate">
            {p.pattern_type}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isForming && (
            <span className="inline-flex items-center gap-1 rounded-md border border-neutral/30 bg-neutral/10 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-neutral">
              <span className="h-1 w-1 rounded-full bg-neutral animate-pulse" />
              Forming
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${tone.badge}`}
          >
            {p.sentiment}
          </span>
        </div>
      </div>

      {/* ── Pattern Description Note ── */}
      {p.description && (
        <p className="text-[11px] text-text-secondary leading-relaxed font-sans">{p.description}</p>
      )}

      {/* ── Metrics Grid: Formation & Confidence Meters ── */}
      <div className="grid grid-cols-2 gap-3 pt-0.5">
        {/* Formation Progress */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="font-semibold uppercase tracking-wider text-text-muted">
              Formation
            </span>
            <span className={`font-mono font-bold tabular-nums ${tone.text}`}>
              {isForming ? `${progressPct}%` : '100%'}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={isForming ? progressPct : 100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${p.pattern_type} formation progress`}
            className="relative h-1.5 w-full bg-surface border border-border-default/50 rounded-full overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${tone.bar}`}
              style={{ width: `${isForming ? progressPct : 100}%` }}
            />
          </div>
        </div>

        {/* Confidence Meter */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="font-semibold uppercase tracking-wider text-text-muted">
              Confidence
            </span>
            <span className="font-mono font-bold tabular-nums text-text-primary">{confPct}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={confPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${p.pattern_type} confidence`}
            className="relative h-1.5 w-full bg-surface border border-border-default/50 rounded-full overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${tone.bar} ${confOpacity}`}
              style={{ width: `${confPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Tags: Volume, Breakout & Bias ── */}
      <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
        {p.volume_validation &&
          (() => {
            const vol = volumeTag(p.volume_validation);
            return (
              <span
                title={`Volume: ${p.volume_validation}`}
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider ${vol.badge}`}
              >
                {vol.glyph} Vol
              </span>
            );
          })()}
        {p.breakout_status && (
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[8.5px] font-semibold tracking-wider ${breakoutTag(
              p.breakout_status,
              sentiment
            )}`}
          >
            {p.breakout_status}
          </span>
        )}
        {p.structural_bias && (
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[8.5px] font-semibold tracking-wider ${MUTED_TAG}`}
          >
            {p.structural_bias}
          </span>
        )}
      </div>
    </div>
  );
}
