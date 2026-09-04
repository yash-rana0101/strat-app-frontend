'use client';

// components/quant/DeepQuantAgentDialog.tsx
//
// The Agent View: the full Deep Quant analysis in a centered dialog over the terminal.
//
// WHAT THIS IS NOT: a second implementation. Every value on screen is read through the same
// `useFq*` hooks the sidebar reads, and the run controls are the same `useQuantRunActions`. There
// is no local copy of the transcript, the status, the plan or the Q&A — if the sidebar says 65%,
// this cannot say anything else, because both are rendering one store.
//
// `@base-ui/react`'s Dialog is used rather than a hand-rolled portal: it is already a dependency
// (see `AnalysisSheet`), and it brings focus trapping, restore-on-close, Escape and `aria-modal`
// that a bare `fixed inset-0` does not. Reaching for a custom overlay here would mean
// reimplementing all four.
//
// Layout: two columns on desktop — transcript left, selected step right. On a narrow viewport the
// dialog becomes a full-screen sheet and the right column stacks BELOW the transcript rather than
// shrinking, because a 360px-wide two-column split leaves neither side readable.
// Renders transcript, progress timeline, detail column, Q&A composer, and right-side session history.

import React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Coins, Loader2, Minimize2, Shield, Square, X, Zap } from 'lucide-react';
import { History, Minimize2, Square, X } from 'lucide-react';

import { useQuantStore, type ReasoningStep } from '../../store/useQuantStore';
import { useTradeStore } from '../../store/useTradeStore';
import { useCredit } from '../../hooks/useApi';
import { isFnoSymbol } from '../../charting/symbolUtils';
import { formatSessionTime } from './session/sessionLabel';
import AgentTerminal from './AgentTerminal';
import TradeQaPanel from './TradeQaPanel';
import ModelSelector from './deep-quant/ModelSelector';
import AgentDetailPanel from './deep-quant/AgentDetailPanel';
import AgentProgressTimeline from './deep-quant/AgentProgressTimeline';
import AgentDialogMetaBar from './deep-quant/AgentDialogMetaBar';
import AgentHistoryPanel from './deep-quant/AgentHistoryPanel';
import ErrorState from './deep-quant/ErrorState';
import EmptyState from './deep-quant/EmptyState';
import type { QuantMode } from './deep-quant/QuantActionBar';
import QuantStatusPill from './deep-quant/QuantStatusPill';
import { FQ_MULTI_SESSION } from '../../lib/env';
import {
  useFqAnalysisError,
  useFqFinalTrade,
  useFqQaMessages,
  useFqReasoningSteps,
  useFqSessionStatus,
} from './useFqSession';
import type { QuantRunActions } from './useQuantRunActions';

interface DeepQuantAgentDialogProps {
  open: boolean;
  onClose: () => void;
  /** The step or `'decision'` row the sidebar was clicked on, so the dialog opens on it. */
  initialSelectedId: string | null;
  mode: QuantMode;
  onModeChange: (mode: QuantMode) => void;
  run: QuantRunActions;
  /** Same handlers the sidebar's ErrorState uses, so Retry behaves identically in both. */
  onRetry: () => void;
}

export default function DeepQuantAgentDialog({
  open,
  onClose,
  initialSelectedId,
  mode,
  onModeChange,
  run,
  onRetry,
}: DeepQuantAgentDialogProps) {
  const reasoningSteps = useFqReasoningSteps();
  const sessionStatus = useFqSessionStatus();
  const finalTrade = useFqFinalTrade();
  const analysisError = useFqAnalysisError();
  const activeProfile = useTradeStore((s) => s.activeProfile);
  const { data: credit } = useCredit();
  const selectedModel = useQuantStore((s) => s.selectedModel);
  const setSelectedModel = useQuantStore((s) => s.setSelectedModel);
  const qaMessages = useFqQaMessages();
  const sessionTime = React.useMemo(() => formatSessionTime(Math.floor(Date.now() / 1000)), []);

  const [selectedId, setSelectedId] = React.useState<string | null>(initialSelectedId);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  // Re-sync when the caller opens the dialog on a different row. Adjusted during render (the
  // React-recommended derive-from-prop pattern) rather than in an effect, so the panel never
  // paints one frame of the previous selection.
  const [syncedInitial, setSyncedInitial] = React.useState(initialSelectedId);
  if (initialSelectedId !== syncedInitial) {
    setSyncedInitial(initialSelectedId);
    setSelectedId(initialSelectedId);
  }

  const selectedStep: ReasoningStep | null = React.useMemo(() => {
    if (!selectedId || selectedId === 'decision') return null;
    return reasoningSteps.find((s) => s.id === selectedId) ?? null;
  }, [selectedId, reasoningSteps]);

  // The `tool_end` that answered the selected call, matched the way the transcript matches them:
  // the next end frame for the same tool after this start. Null when the stream carried none,
  // which is a real state (a run cancelled mid-tool) and renders as no Result section.
  const selectedResult: string | null = React.useMemo(() => {
    if (!selectedStep) return null;
    const startIdx = reasoningSteps.indexOf(selectedStep);
    if (startIdx < 0) return null;
    const end = reasoningSteps
      .slice(startIdx + 1)
      .find((s) => s.type === 'tool_end' && s.toolName === selectedStep.toolName);
    return end?.content ?? null;
  }, [selectedStep, reasoningSteps]);

  const symbolLabel = `${run.symbol} · ${run.activeTimeframe}`;
  const hasRun = reasoningSteps.length > 0 || sessionStatus !== 'idle';

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        {/* The chart stays visible behind, deliberately: the analysis is about what is on it. */}
        <Dialog.Backdrop
          className="
            fixed inset-0 z-9998 min-h-dvh bg-black/60 backdrop-blur-[2px]
            transition-opacity duration-200
            data-ending-style:opacity-0 data-starting-style:opacity-0
            motion-reduce:transition-none
          "
        />

        <Dialog.Popup
          className="
            fixed inset-0 z-9999 flex flex-col overflow-hidden border-border-default bg-surface
            sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[88vh] sm:w-[min(1200px,calc(100vw-3rem))]
            sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:shadow-2xl
            transition-[transform,opacity] duration-200 ease-out
            data-ending-style:opacity-0 data-starting-style:opacity-0
            sm:data-ending-style:scale-95 sm:data-starting-style:scale-95
            motion-reduce:transition-none focus-visible:outline-none
          "
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-start gap-3 border-b border-border-default px-4 py-3">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-xs font-black uppercase tracking-wider text-text-primary">
                Strat Agent
              </Dialog.Title>
              <p className="mt-0.5 text-[10px] text-text-muted">
                AI-powered trading analysis for smarter decisions
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <QuantStatusPill status={sessionStatus} />

              {/* Mode Switcher: Agent Mode -> Chat Mode */}
              <div className="flex items-center rounded-md bg-elevated/40 p-0.5 border border-border-default/60 text-[9px] font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Switch to Chat mode"
                  title="Switch to Chat Mode (Sidebar View)"
                  className="rounded px-2 py-0.5 text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Minimize2 size={10} aria-hidden="true" />
                  <span>Chat Mode</span>
                </button>
                <span className="rounded px-2 py-0.5 bg-elevated text-text-primary shadow-xs">
                  Agent Mode
                </span>
              </div>

              {/* History Button (toggles right-side panel) */}
              {FQ_MULTI_SESSION && (
                <button
                  type="button"
                  onClick={() => setHistoryOpen((v) => !v)}
                  aria-expanded={historyOpen}
                  aria-label="Session history"
                  title="Session history"
                  className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    historyOpen
                      ? 'bg-elevated border-primary/50 text-text-primary shadow-xs'
                      : 'border-border-default/60 bg-elevated/40 text-text-muted hover:text-text-primary hover:bg-elevated'
                  }`}
                >
                  <History size={11} aria-hidden="true" />
                  <span>History</span>
                </button>
              )}

              {run.isAnalyzing && (
                <button
                  type="button"
                  onClick={run.cancelAnalysis}
                  className="flex items-center gap-1 rounded bg-rose-600 hover:bg-rose-500 active:bg-rose-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
                >
                  <Square size={9} />
                  Stop analysis
                </button>
              )}
              <Dialog.Close
                aria-label="Close full analysis"
                className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
              >
                <X size={14} aria-hidden="true" />
              </Dialog.Close>
            </div>
          </div>

          {/* ── Session meta + primary action ──────────────────────────── */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-default/40 px-4 py-2.5 bg-elevated/5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-text-primary">{symbolLabel}</span>
              <span className="rounded-sm border border-border-default bg-elevated/60 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-text-muted">
                {isFnoSymbol(run.symbol) ? 'NFO' : 'NSE'}
              </span>
              <span className="rounded-sm border border-border-default bg-elevated px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-text-secondary">
                {activeProfile}
              </span>
              <span className="text-[9px] text-text-muted">
                {run.dataReady ? `${run.symbolCandleCount} candles` : 'Loading candles…'}
                {run.insufficientData ? ' (low)' : ''}
                {reasoningSteps.length > 0 ? ` · ${reasoningSteps.length} steps` : ''}
                {qaMessages.length > 0 ? ` · ${qaMessages.length} messages` : ''}
                {sessionTime ? ` · ${sessionTime}` : ''}
              </span>
          <AgentDialogMetaBar
            symbol={run.symbol}
            activeTimeframe={run.activeTimeframe}
            activeProfile={activeProfile}
            dataReady={run.dataReady}
            insufficientData={run.insufficientData}
            symbolCandleCount={run.symbolCandleCount}
            reasoningStepsCount={reasoningSteps.length}
            qaMessagesCount={qaMessages.length}
            sessionTime={sessionTime}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isAnalyzing={run.isAnalyzing}
            credit={credit}
            mode={mode}
            onModeChange={onModeChange}
            onRun={onRetry}
            onStop={run.cancelAnalysis}
          />

              {/* Model Selector badge */}
              <div className="scale-90 origin-left">
                <ModelSelector
                  value={selectedModel}
                  onChange={setSelectedModel}
                  disabled={run.isAnalyzing}
                  variant="inline"
                />
              </div>

              {/* Credits & plan badge */}
              {credit && (
                <span className="flex items-center gap-1.5 rounded border border-border-default/60 bg-elevated/35 px-2 py-1 text-[9px]">
                  <Coins size={10} className="shrink-0 text-amber-400" aria-hidden="true" />
                  <span className="font-mono font-semibold text-text-primary">
                    {credit.credits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-text-muted">
                    credits · {credit.hasActiveSubscription ? credit.planName : 'Pro'}
                  </span>
                </span>
              )}
            </div>

            {/* Mode tabs and Primary Action */}
            <div className="flex items-center gap-2">
              <div className="flex rounded bg-elevated/40 p-0.5 border border-border-default/60">
                <button
                  type="button"
                  disabled={run.isAnalyzing}
                  onClick={() => onModeChange('FIND')}
                  className={`rounded px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mode === 'FIND'
                      ? 'bg-elevated text-text-primary shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Find Trade
                </button>
                <button
                  type="button"
                  disabled={run.isAnalyzing}
                  onClick={() => onModeChange('VERIFY')}
                  className={`rounded px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mode === 'VERIFY'
                      ? 'bg-elevated text-text-primary shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Verify Setup
                </button>
              </div>

              <button
                type="button"
                disabled={!run.isAnalyzing && !run.dataReady}
                onClick={() => {
                  if (run.isAnalyzing) run.cancelAnalysis();
                  else onRetry();
                }}
                className={`flex h-8 items-center justify-center gap-1.5 rounded px-3 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  !run.dataReady && !run.isAnalyzing
                    ? 'bg-elevated/40 text-text-muted/50 border border-border-default opacity-50 cursor-not-allowed'
                    : run.isAnalyzing
                      ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'
                }`}
              >
                {!run.dataReady && !run.isAnalyzing ? (
                  <Loader2 size={11} className="animate-spin text-text-muted" />
                ) : run.isAnalyzing ? (
                  <Square size={11} />
                ) : mode === 'VERIFY' ? (
                  <Shield size={11} />
                ) : (
                  <Zap size={11} />
                )}
                {!run.dataReady && !run.isAnalyzing
                  ? 'Awaiting data…'
                  : run.isAnalyzing
                    ? 'Stop analysis'
                    : mode === 'VERIFY'
                      ? 'Verify my setup'
                      : 'Find quant trade'}
              </button>
            </div>
          </div>

          <AgentProgressTimeline
            reasoningSteps={reasoningSteps}
            sessionStatus={sessionStatus}
            finalTrade={finalTrade}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {/* ── Body ───────────────────────────────────────────────────── */}
          {/* `min-h-0` is load-bearing in a flex column: without it the scroll containers grow to
              their content and the composer is pushed off screen. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Reasoning timeline. The plan card is suppressed here because the right column
                already shows those levels — see `showTradePlan`. */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:border-r lg:border-border-default/40">
              {!hasRun ? (
                // Scrolls on its own: `EmptyState`'s illustration has a 350px floor and `ErrorState`
                // is centred, so on a short viewport an `overflow-hidden` parent would clip the
                // Retry button out of reach.
                <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                  {analysisError ? (
                    <ErrorState
                      error={analysisError}
                      dataReady={run.dataReady}
                      activeMode={mode}
                      onRetryFind={onRetry}
                      onRetryVerify={onRetry}
                    />
                  ) : (
                    <EmptyState symbol={run.symbol} />
                  )}
                </div>
              ) : (
                <AgentTerminal
                  onSelectStep={(step) => setSelectedId(step.id)}
                  selectedStepId={selectedId}
                  showTradePlan={false}
                />
              )}
            </div>

            {/* Detail column. Scrolls on its own so a long setup_validation never moves the
                transcript. Below the transcript on a narrow viewport rather than beside it. */}
            {hasRun && (
              <aside className="min-h-0 shrink-0 overflow-y-auto border-t border-border-default/40 scrollbar-thin lg:w-[380px] lg:border-t-0 xl:w-[420px] max-lg:max-h-[45%]">
                <AgentDetailPanel
                  step={selectedStep}
                  finalTrade={finalTrade}
                  resultContent={selectedResult}
                  symbol={run.symbol}
                  sessionStatus={sessionStatus}
                />
              </aside>
            )}

            {/* ── Right-Side History Panel ─────────────────────────────── */}
            {historyOpen && FQ_MULTI_SESSION && (
              <AgentHistoryPanel onClose={() => setHistoryOpen(false)} />
            )}
          </div>

          {/* ── Q&A, sticky at the bottom ──────────────────────────────── */}
          {/* The same composer the sidebar uses, with the same unlock rule and placeholder ladder.
              `env(safe-area-inset-bottom)` keeps it reachable above a mobile keyboard inset. */}
          {hasRun && (
            <div className="shrink-0 border-t border-border-default" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <TradeQaPanel />
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
