'use client';

// components/quant/deep-quant/QuantStatusPill.tsx
//
// The run state, in one line. Rendered in the sidebar header and again in the Agent View header,
// from the SAME `sessionStatus` — so the two surfaces cannot claim different things.
//
// The five states are the store's own (`QuantSession.sessionStatus`); nothing here invents a
// sixth. `Analysing` and `Failed` are wording only — the underlying values stay `running` and
// `error`, which is what every selector, test and backend frame already uses.

import React from 'react';

export type QuantRunStatus = 'idle' | 'running' | 'watching' | 'complete' | 'error' | string;

interface StatusStyle {
  label: string;
  /** The dot's colour. */
  dot: string;
  text: string;
  /** Whether the dot carries the slow ping — only the two states that are genuinely in flight. */
  pulse: boolean;
}

const STATUS: Record<string, StatusStyle> = {
  idle: { label: 'Idle', dot: 'bg-text-muted', text: 'text-text-muted', pulse: false },
  running: { label: 'Analysing', dot: 'bg-emerald-500', text: 'text-emerald-500', pulse: true },
  watching: { label: 'Watching', dot: 'bg-amber-500', text: 'text-amber-500', pulse: true },
  complete: { label: 'Complete', dot: 'bg-emerald-500', text: 'text-emerald-500', pulse: false },
  error: { label: 'Failed', dot: 'bg-rose-500', text: 'text-rose-500', pulse: false },
};

export function statusLabel(status: QuantRunStatus): string {
  return STATUS[status]?.label ?? String(status);
}

export default function QuantStatusPill({
  status,
  className = '',
}: {
  status: QuantRunStatus;
  className?: string;
}) {
  const style = STATUS[status] ?? STATUS.idle;

  return (
    <span
      // `aria-live` so a screen reader hears the run finish. Polite, not assertive: the state
      // changes several times per run and interrupting each time would be unusable.
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider select-none ${style.text} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {style.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${style.dot}`}
            aria-hidden="true"
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      </span>
      {style.label}
    </span>
  );
}
