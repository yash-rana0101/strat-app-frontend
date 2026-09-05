'use client';

// components/quant/session/SessionLoadingState.tsx
//
// Reusable loading skeleton and status state when opening or restoring an analysis session.
// Used across DeepQuantAgentDialog, DeepQuantPanel, and SessionWorkspace.

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export interface SessionLoadingStateProps {
  symbol?: string;
  variant?: 'full' | 'compact';
  title?: string;
  description?: string;
}

export default function SessionLoadingState({
  symbol,
  variant = 'full',
  title = 'Restoring session analysis…',
  description = 'Rebuilding reasoning steps, AI decisions, and conversation transcript…',
}: SessionLoadingStateProps) {
  if (variant === 'compact') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-3 p-3.5 animate-fade-in select-none"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
          <Loader2 size={13} className="animate-spin text-primary shrink-0" aria-hidden="true" />
          <span className="truncate">{title}</span>
        </div>

        {/* Compact skeleton rows mimicking progress items */}
        <div className="space-y-2" aria-hidden="true">
          <div className="h-6 w-full animate-pulse rounded bg-elevated/60 border border-border-default/40" />
          <div className="h-6 w-4/5 animate-pulse rounded bg-elevated/60 border border-border-default/40" />
          <div className="h-6 w-2/3 animate-pulse rounded bg-elevated/60 border border-border-default/40" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full min-h-[260px] flex-1 flex-col items-center justify-center p-6 animate-fade-in select-none"
    >
      <span className="sr-only">Opening session…</span>
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {/* Animated icon pill */}
        <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
          <Sparkles size={20} className="animate-pulse" aria-hidden="true" />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface border border-border-default shadow-xs">
            <Loader2 size={10} className="animate-spin text-primary" aria-hidden="true" />
          </span>
        </div>

        {/* Title and context */}
        <h3 className="text-sm font-bold tracking-tight text-text-primary">{title}</h3>
        <p className="mt-1 text-xs text-text-muted leading-relaxed">{description}</p>

        {symbol && (
          <span className="mt-2.5 inline-flex items-center rounded-sm border border-border-default bg-elevated/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            {symbol}
          </span>
        )}

        {/* Shimmering step skeletons mimicking timeline & terminal output */}
        <div className="mt-6 w-full space-y-2.5 text-left" aria-hidden="true">
          <div className="flex items-center gap-2.5 rounded-md border border-border-default/50 bg-elevated/40 p-2">
            <div className="h-3 w-3 rounded-full bg-primary/30 animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-elevated/70 animate-pulse" />
          </div>
          <div className="flex items-center gap-2.5 rounded-md border border-border-default/50 bg-elevated/40 p-2">
            <div className="h-3 w-3 rounded-full bg-primary/20 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-elevated/70 animate-pulse" />
          </div>
          <div className="flex items-center gap-2.5 rounded-md border border-border-default/50 bg-elevated/40 p-2">
            <div className="h-3 w-3 rounded-full bg-primary/20 animate-pulse" />
            <div className="h-2/3 w-3/5 rounded bg-elevated/70 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
