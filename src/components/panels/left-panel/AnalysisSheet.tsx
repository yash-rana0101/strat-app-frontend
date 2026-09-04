'use client';

import React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Tabs } from '@base-ui/react/tabs';
import { AlertTriangle, X } from 'lucide-react';
import type {
  ConsensusReport,
  MultiTfChartPatterns,
  SentimentPayload,
} from '../../../store/useQuantStore';
import SentimentBlock from './SentimentBlock';
import LiveAssetHUD from './LiveAssetHUD';
import MultiTfPatternsView from '../../quant/deep-quant/MultiTfPatternsView';
import { consensusMatchesSymbol } from './consensusView';
import { totalPatternCount } from './patternsSummary';
import {
  type AnalysisTab,
  TAB_ORDER,
  TAB_LABELS,
  TAB_SHORT_LABELS,
  TAB_ICONS,
  EmptyTechnical,
  TabBadge,
} from './analysisSheetTypes';

export type { AnalysisTab };

export interface AnalysisSheetProps {
  /** The section to show, or `null` to keep the sheet closed. */
  tab: AnalysisTab | null;
  /** Switching section from the tab bar. Does not close the sheet. */
  onTabChange: (tab: AnalysisTab) => void;
  onClose: () => void;
  /** The symbol the analyses on show belong to. */
  symbol?: string;

  sentiment: SentimentPayload | null;
  isSentimentLoading: boolean;
  sentimentError: string | null;

  consensus: ConsensusReport | null;
  /** When `consensus` was computed (epoch ms), or null if unknown. */
  consensusComputedAt: number | null;

  multiTfPatterns: MultiTfChartPatterns[] | null;
  isPatternsLoading: boolean;
  patternsError: string | null;
}

export default function AnalysisSheet({
  tab,
  onTabChange,
  onClose,
  symbol,
  sentiment,
  isSentimentLoading,
  sentimentError,
  consensus,
  consensusComputedAt,
  multiTfPatterns,
  isPatternsLoading,
  patternsError,
}: AnalysisSheetProps) {
  const open = tab !== null;
  const currentTab = tab ?? 'sentiment';

  const technical = consensus && consensusMatchesSymbol(consensus.symbol, symbol) ? consensus : null;
  const patternTotal = totalPatternCount(multiTfPatterns);

  const renderBadge = (section: AnalysisTab, isActive: boolean) => {
    if (section === 'sentiment') {
      if (sentimentError) {
        return (
          <TabBadge tone="warn" active={isActive}>
            <AlertTriangle size={7} aria-hidden="true" />
          </TabBadge>
        );
      }
      if (sentiment && !isSentimentLoading) {
        return (
          <TabBadge tone="neutral" active={isActive}>
            {sentiment.headlines.length}
          </TabBadge>
        );
      }
      return null;
    }

    if (section === 'technical') {
      if (technical) {
        return (
          <TabBadge tone="neutral" active={isActive}>
            {technical.trend_score > 0 ? '+' : ''}
            {technical.trend_score}
          </TabBadge>
        );
      }
      return null;
    }

    if (section === 'patterns') {
      if (patternsError) {
        return (
          <TabBadge tone="warn" active={isActive}>
            <AlertTriangle size={7} aria-hidden="true" />
          </TabBadge>
        );
      }
      if (patternTotal > 0 && !isPatternsLoading) {
        return (
          <TabBadge tone="neutral" active={isActive}>
            {patternTotal}
          </TabBadge>
        );
      }
      return null;
    }

    return null;
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        // Backdrop press, Escape, and the close button all arrive here.
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className="
            fixed inset-0 z-9998 min-h-dvh bg-black/50 backdrop-blur-[2px]
            transition-opacity duration-200
            data-ending-style:opacity-0 data-starting-style:opacity-0
            motion-reduce:transition-none
          "
        />

        <Dialog.Popup
          className="
            fixed top-1/2 left-1/2 z-9999 flex h-[min(640px,85vh)] w-125 max-w-[calc(100vw-2rem)]
            -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden
            rounded-lg border border-border-default bg-surface shadow-2xl
            transition-[transform,opacity] duration-200 ease-out
            data-ending-style:scale-95 data-ending-style:opacity-0
            data-starting-style:scale-95 data-starting-style:opacity-0
            motion-reduce:transition-none
            focus-visible:outline-none
          "
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border-default bg-elevated/20 px-4">
            <Dialog.Title className="text-xs font-black uppercase tracking-wider text-text-primary">
              Market Watch
            </Dialog.Title>

            {symbol && (
              <span className="rounded-none border border-border-default bg-elevated px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-text-secondary">
                {symbol}
              </span>
            )}

            <Dialog.Close
              aria-label="Close details"
              className="
                ml-auto flex h-6 w-6 items-center justify-center rounded-none
                text-text-muted transition-colors hover:bg-elevated hover:text-text-primary
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary
              "
            >
              <X size={14} aria-hidden="true" />
            </Dialog.Close>
          </div>

          <Tabs.Root
            value={currentTab}
            onValueChange={(value) => onTabChange(value as AnalysisTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <Tabs.List
              aria-label="Analysis sections"
              activateOnFocus
              className="flex shrink-0 items-stretch border-b border-border-default bg-elevated/10"
            >
              {TAB_ORDER.map((value) => {
                const Icon = TAB_ICONS[value];
                const isActive = value === currentTab;

                return (
                  <Tabs.Tab
                    key={value}
                    value={value}
                    aria-label={TAB_LABELS[value]}
                    className={`
                      relative flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5
                      text-[9px] uppercase tracking-wider border-b-2
                      transition-all duration-150 select-none
                      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary
                      ${
                        isActive
                          ? 'border-primary bg-surface text-text-primary font-black shadow-[inset_0_-2px_0_0_var(--color-primary)]'
                          : 'border-transparent bg-transparent text-text-muted font-bold hover:bg-elevated/40 hover:text-text-secondary'
                      }
                    `}
                  >
                    <Icon
                      size={11}
                      aria-hidden="true"
                      className={`transition-colors ${isActive ? 'text-primary' : 'text-text-muted'}`}
                    />
                    <span>{TAB_SHORT_LABELS[value]}</span>
                    {renderBadge(value, isActive)}
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>

            <Tabs.Panel
              value="sentiment"
              className="min-h-0 flex-1 overflow-y-auto scrollbar-thin focus-visible:outline-none"
            >
              <SentimentBlock
                symbol={symbol}
                sentiment={sentiment}
                isLoading={isSentimentLoading}
                error={sentimentError}
                variant="sheet"
              />
            </Tabs.Panel>

            <Tabs.Panel
              value="technical"
              className="min-h-0 flex-1 overflow-y-auto scrollbar-thin focus-visible:outline-none"
            >
              {technical ? (
                <LiveAssetHUD data={technical} computedAt={consensusComputedAt} variant="sheet" />
              ) : (
                <EmptyTechnical symbol={symbol} />
              )}
            </Tabs.Panel>

            <Tabs.Panel
              value="patterns"
              className="min-h-0 flex-1 overflow-y-auto scrollbar-thin focus-visible:outline-none"
            >
              <MultiTfPatternsView variant="sheet" />
            </Tabs.Panel>
          </Tabs.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
