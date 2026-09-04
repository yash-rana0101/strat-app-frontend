'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SentimentPayload } from '../../../../store/useQuantStore';
import { fadeInUp } from '../../../../lib/motionVariants';
import { sentimentTone, scoreToTrackPercent, parseRawHeadline } from './sentimentUtils';

interface SentimentHeroCardProps {
  sentiment: SentimentPayload;
  inSheet?: boolean;
}

export default function SentimentHeroCard({ sentiment, inSheet = false }: SentimentHeroCardProps) {
  const tone = sentimentTone(sentiment.score);
  const trackPercent = scoreToTrackPercent(sentiment.score);
  const magnitude = Math.abs(trackPercent - 50);
  const barLeft = Math.min(50, trackPercent);

  // Parse top catalyst headline for potential link or publisher
  const parsedTop = parseRawHeadline(sentiment.top_headline);
  const topArticle = sentiment.articles?.find(
    (a) => a.title.toLowerCase() === sentiment.top_headline.toLowerCase() ||
      a.title.toLowerCase() === parsedTop.title.toLowerCase(),
  );
  const topUrl = topArticle?.url || parsedTop.url;

  const Icon = sentiment.score > 0 ? TrendingUp : sentiment.score < 0 ? TrendingDown : Minus;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeInUp}
      className={`
        rounded-xl border border-border-default/80 bg-gradient-to-b from-elevated/60 to-elevated/20
        shadow-sm ${inSheet ? 'p-4 gap-4' : 'p-3 gap-3'} flex flex-col
      `}
    >
      {/* ── Top Row: Score, Badge & Direction ────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`
              ${inSheet ? 'text-3xl' : 'text-xl'}
              font-black tabular-nums tracking-tight ${tone.text}
            `}
          >
            {sentiment.score > 0 ? '+' : ''}
            {sentiment.score}
          </span>
          <span
            className={`
              inline-flex items-center rounded-md px-2 py-0.5
              text-[9px] font-bold uppercase tracking-wider border ${tone.badge}
            `}
          >
            {sentiment.label}
          </span>
        </div>

        <div
          className={`
            flex items-center gap-1 px-2 py-1 rounded-md border
            ${tone.border} ${tone.bg} text-[10px] font-semibold ${tone.text}
          `}
        >
          <Icon size={12} />
          <span className="capitalize">{sentiment.impact} Sentiment</span>
        </div>
      </div>

      {/* ── Sentiment Diverging Gauge ─────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-text-muted/70">
          <span>Bearish (-100)</span>
          <span>Neutral (0)</span>
          <span>Bullish (+100)</span>
        </div>

        <div
          role="meter"
          aria-valuenow={sentiment.score}
          aria-valuemin={-100}
          aria-valuemax={100}
          aria-label="News sentiment score meter"
          className="relative h-2 w-full overflow-hidden rounded-full border border-border-default/60 bg-elevated/80"
        >
          {/* Active diverging bar originating from center datum (50%) */}
          <div
            className={`absolute top-0 h-full ${tone.bar} rounded-full transition-all duration-300`}
            style={{ left: `${barLeft}%`, width: `${magnitude}%` }}
          />
          {/* Neutral center datum line */}
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-text-muted/60" />
        </div>
      </div>

      {/* ── Key Catalyst Callout ─────────────────────────────────────── */}
      {sentiment.top_headline && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border-default/60 bg-surface/70 p-2.5">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-text-muted">
            <Sparkles size={11} className="text-primary" />
            <span>Key Catalyst</span>
          </div>

          {topUrl ? (
            <a
              href={topUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link flex items-start justify-between gap-2 hover:opacity-90 transition-opacity"
            >
              <p
                className={`
                  ${inSheet ? 'text-xs' : 'text-[11px]'}
                  font-medium leading-relaxed text-text-primary group-hover/link:text-primary transition-colors
                `}
              >
                {parsedTop.title}
              </p>
              <ExternalLink
                size={12}
                className="shrink-0 text-text-muted group-hover/link:text-primary transition-colors mt-0.5"
              />
            </a>
          ) : (
            <p
              className={`
                ${inSheet ? 'text-xs' : 'text-[11px]'}
                font-medium leading-relaxed text-text-secondary
              `}
            >
              {parsedTop.title}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

