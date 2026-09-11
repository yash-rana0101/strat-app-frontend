'use client';

import React from 'react';
import { AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';

/**
 * The four states a summary strip can be in.
 *
 * `empty` and `error` are deliberately separate. A sentiment fetch that FAILED
 * and a symbol that simply has no reading yet are different facts, and
 * collapsing them into one grey row is what makes a broken service look like a
 * calm market. Each state gets its own visual and its own words.
 */
export type SummaryStripState = 'ready' | 'loading' | 'error' | 'empty';

export interface SummaryStripProps {
  /** Leading glyph. Decorative — the label carries the meaning. */
  icon: React.ReactNode;
  /** Short section name, rendered uppercase (e.g. "AI News Sentiment"). */
  label: string;
  /** Opens the detail sheet on this section's tab. */
  onClick: () => void;
  state?: SummaryStripState;
  /**
   * The compact reading. Rendered in `ready` only.
   */
  value?: React.ReactNode;
  /** Optional second line in `ready` (a gauge bar, a supporting phrase). */
  detail?: React.ReactNode;
  /**
   * Spoken description of `value`, since `value` is arbitrary JSX and often
   * conveys meaning through colour and bar position.
   */
  valueText?: string;
  /** Small qualifier beside the label (e.g. "on RELIANCE", "stale"). */
  badge?: React.ReactNode;
  errorMessage?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

/** Icon-chip background/foreground per state — the first thing the eye reads. */
const ICON_TONE: Record<SummaryStripState, string> = {
  ready: 'text-text-secondary group-hover:text-text-primary',
  loading: 'text-primary',
  error: 'text-bear',
  empty: 'text-text-muted',
};

export default function SummaryStrip({
  icon,
  label,
  onClick,
  state = 'ready',
  value,
  detail,
  valueText,
  badge,
  errorMessage,
  emptyMessage,
  loadingMessage = 'Loading',
}: SummaryStripProps) {
  // What the row is currently saying, in words. Drives both the visible
  // secondary line (for non-ready states) and the button's accessible name.
  const statusText =
    state === 'loading'
      ? loadingMessage
      : state === 'error'
        ? (errorMessage ?? 'Unavailable')
        : state === 'empty'
          ? (emptyMessage ?? 'No data')
          : (valueText ?? '');

  const isEmptyCta = state === 'empty' && emptyMessage === 'Run Strat AI Agent';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={`${label}${statusText ? `, ${statusText}` : ''}. Open details.`}
      className="
        group relative flex w-full flex-col gap-2 rounded-xl border border-border-default/50
        bg-elevated/20 p-2.5 text-left
        transition-all duration-150 hover:bg-elevated/60 hover:border-border-default
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary
        cursor-pointer
      "
    >
      {/* ── Upper: Large Icon + Section Name + Chevron ── */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-center transition-colors ${ICON_TONE[state]}`}
          >
            {icon}
          </span>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-[10px] font-extrabold uppercase tracking-wider text-text-secondary group-hover:text-text-primary transition-colors">
              {label}
            </span>
            {badge}
          </div>
        </div>

        <ChevronRight
          size={13}
          aria-hidden="true"
          className="shrink-0 text-text-muted/60 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-text-primary"
        />
      </div>

      {/* ── Below: Summary Data & Details ── */}
      <div className="flex flex-col gap-1.5 w-full">
        {state === 'ready' ? (
          value && <div className="flex items-center justify-between gap-2 w-full">{value}</div>
        ) : state === 'loading' ? (
          <span
            role="status"
            className="flex items-center gap-1.5 self-start rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5"
          >
            <Loader2 size={10} aria-hidden="true" className="animate-spin text-primary" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-primary">
              {loadingMessage}
            </span>
          </span>
        ) : state === 'error' ? (
          <span className="flex items-center gap-1.5 self-start rounded-md bg-bear/10 border border-bear/20 px-2 py-0.5">
            <AlertTriangle size={10} aria-hidden="true" className="shrink-0 text-bear" />
            <span className="text-[8.5px] font-black uppercase tracking-wider text-bear">
              Unavailable
            </span>
          </span>
        ) : (
          <span
            className={`self-start rounded-md px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${isEmptyCta
                ? 'bg-primary/10 border border-primary/30 text-primary'
                : 'bg-elevated/80 border border-border-default text-text-muted'
              }`}
          >
            {emptyMessage ?? 'No data'}
          </span>
        )}

        {/* Second line / detail */}
        {state === 'ready' && detail ? (
          <div className="min-w-0 w-full">{detail}</div>
        ) : state === 'error' && errorMessage ? (
          <p className="truncate text-[9px] leading-snug text-bear/90">{errorMessage}</p>
        ) : null}
      </div>
    </button>
  );
}
