'use client';

// components/quant/DeepQuantAgentDialog.tsx
// The Agent View: the full Deep Quant analysis in a centered dialog over the terminal.
// Renders transcript, progress timeline, detail column, Q&A composer, and right-side session history.

import React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { History, Square, X } from 'lucide-react';

import { useQuantStore } from '../../store/useQuantStore';
import { useTradeStore } from '../../store/useTradeStore';
import { useCredit } from '../../hooks/useApi';
import { formatSessionTime } from './session/sessionLabel';
import AgentTerminal from './AgentTerminal';
import TradeQaPanel from './TradeQaPanel';
import AgentDetailPanel from './deep-quant/AgentDetailPanel';
import AgentDialogMetaBar from './deep-quant/AgentDialogMetaBar';
import AgentHistoryPanel from './deep-quant/AgentHistoryPanel';
import VerificationForm, { type VerificationFormProps } from './deep-quant/VerificationForm';
import ModelSelector from './deep-quant/ModelSelector';
import ErrorState from './deep-quant/ErrorState';
import EmptyState from './deep-quant/EmptyState';
import type { QuantMode } from './deep-quant/QuantActionBar';
import QuantStatusPill from './deep-quant/QuantStatusPill';
import { FQ_MULTI_SESSION } from '../../lib/env';
import SessionLoadingState from './session/SessionLoadingState';
import {
  useFqAnalysisError,
  useFqFinalTrade,
  useFqIsSessionHydrating,
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
  verificationForm?: Omit<VerificationFormProps, 'isAnalyzing' | 'dataReady'>;
}

export default function DeepQuantAgentDialog({
  open,
  onClose,
  initialSelectedId,
  mode,
  onModeChange,
  run,
  onRetry,
  verificationForm,
}: DeepQuantAgentDialogProps) {
  const reasoningSteps = useFqReasoningSteps();
  const sessionStatus = useFqSessionStatus();
  const finalTrade = useFqFinalTrade();
  const analysisError = useFqAnalysisError();
  const isSessionLoading = useFqIsSessionHydrating();
  const activeProfile = useTradeStore((s) => s.activeProfile);
  const { data: credit } = useCredit();
  const selectedModel = useQuantStore((s) => s.selectedModel);
  const setSelectedModel = useQuantStore((s) => s.setSelectedModel);
  const qaMessages = useFqQaMessages();
  const sessionTime = React.useMemo(() => formatSessionTime(Math.floor(Date.now() / 1000)), []);

  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [isConfiguringSetup, setIsConfiguringSetup] = React.useState(false);

  const handleVerifySubmit = () => {
    setIsConfiguringSetup(false);
    verificationForm?.onSubmit();
  };

  const hasRun = reasoningSteps.length > 0 || sessionStatus !== 'idle';

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
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
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-default px-4 py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <Dialog.Title className="text-xs font-black uppercase tracking-wider text-text-primary">
                  Strat Agent
                </Dialog.Title>
                <p className="mt-0.5 text-[10px] text-text-muted">
                  AI-powered trading analysis for smarter decisions
                </p>
              </div>

              <div className="w-[180px] shrink-0">
                <ModelSelector
                  value={selectedModel}
                  onChange={setSelectedModel}
                  disabled={run.isAnalyzing}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <QuantStatusPill status={sessionStatus} />



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
            onModeChange={(newMode) => {
              if (newMode === 'VERIFY') {
                setIsConfiguringSetup(true);
              }
              onModeChange(newMode);
            }}
            onRun={() => {
              setIsConfiguringSetup(false);
              onRetry();
            }}
            onStop={run.cancelAnalysis}
            hasRun={hasRun}
            isSessionLoading={isSessionLoading}
            isConfiguringSetup={isConfiguringSetup}
            onToggleConfigureSetup={() => setIsConfiguringSetup((v) => !v)}
          />

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Reasoning timeline / Verification setup form */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:border-r lg:border-border-default/40">
              {isSessionLoading ? (
                <SessionLoadingState variant="full" symbol={run.symbol} />
              ) : mode === 'VERIFY' && (!hasRun || isConfiguringSetup) && verificationForm ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                  <div className="mx-auto max-w-xl">
                    <VerificationForm
                      {...verificationForm}
                      onSubmit={handleVerifySubmit}
                      isAnalyzing={run.isAnalyzing}
                      dataReady={run.dataReady}
                    />
                  </div>
                </div>
              ) : !hasRun ? (
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
                  showTradePlan={false}
                />
              )}
            </div>

            {/* Detail column */}
            {hasRun && (!isConfiguringSetup || mode !== 'VERIFY') && (
              <aside className="min-h-0 shrink-0 overflow-y-auto border-t border-border-default/40 scrollbar-thin lg:w-[380px] lg:border-t-0 xl:w-[420px] max-lg:max-h-[45%]">
                <AgentDetailPanel
                  finalTrade={finalTrade}
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
          {hasRun && (
            <div
              className="shrink-0 border-t border-border-default"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <TradeQaPanel />
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
