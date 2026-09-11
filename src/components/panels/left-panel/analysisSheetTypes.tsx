import React from 'react';
import { Newspaper, Sparkles, TrendingUp } from 'lucide-react';

/** The sections the sheet can show. A `null` tab means the sheet is closed. */
export type AnalysisTab = 'sentiment' | 'technical' | 'patterns';

export const TAB_ORDER: AnalysisTab[] = ['sentiment', 'technical', 'patterns'];

export const TAB_LABELS: Record<AnalysisTab, string> = {
  sentiment: 'AI News Sentiment',
  technical: 'Technical Consensus',
  patterns: 'Pattern Scanner',
};

/** Short forms for the tab bar, which has three of these to fit in ~420px. */
export const TAB_SHORT_LABELS: Record<AnalysisTab, string> = {
  sentiment: 'Sentiment',
  technical: 'Technical',
  patterns: 'Patterns',
};

export const TAB_ICONS: Record<
  AnalysisTab,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  sentiment: Newspaper,
  technical: TrendingUp,
  patterns: Sparkles,
};

/**
 * What the technical tab says when nothing has been computed for this symbol.
 */
export function EmptyTechnical({ symbol }: { symbol?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <TrendingUp size={20} aria-hidden="true" className="text-text-muted/40" />
      <p className="text-xs font-bold tracking-tight text-text-primary">
        No technical reading for{' '}
        <span className="font-extrabold text-primary">{symbol || 'this symbol'}</span>
      </p>
      <p className="max-w-70 text-[11px] leading-relaxed text-text-secondary">
        Run Strat AI Agent to compute the technical consensus, patterns and active strategies
        for this instrument.
      </p>
    </div>
  );
}

/**
 * The badge on a tab: what that section is currently reporting, in one token.
 */
export function TabBadge({
  tone,
  active = false,
  children,
}: {
  tone: 'neutral' | 'warn';
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`
        flex h-3.5 min-w-3.5 items-center justify-center rounded-sm border px-1
        text-[8px] font-black tabular-nums transition-colors
        ${tone === 'warn'
          ? 'border-neutral/40 bg-neutral/15 text-neutral'
          : active
            ? 'border-primary/40 bg-primary/15 text-primary'
            : 'border-border-default bg-elevated/60 text-text-muted'
        }
      `}
    >
      {children}
    </span>
  );
}
