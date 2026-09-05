'use client';

// components/quant/DeepQuantPanel.tsx
//
// The SIDEBAR VIEW. "What is happening?" — and a way into "show me everything".
//
// What changed, and why
// ---------------------
// This panel used to render the whole glass box in a ~380px column: the full transcript, every
// tool argument, and the model's `setup_validation` paragraph. The result was that the one thing
// the user opens the panel for — action, conviction, entry/target/stop — sat below several screens
// of reasoning. So the surface is now split:
//
//   * here: session tabs, the run control, metadata, status, a CONDENSED progress list, the
//     compact result card, and the composer;
//   * `DeepQuantAgentDialog`: the complete transcript, the full setup validation, the tool
//     arguments and results, the metrics and the execution plan.
//
// What did NOT change: the store, the stream, the modes, the gating, the placeholder ladder, the
// error strings, session handling. The run handlers moved to `useQuantRunActions` so the dialog
// presses the same code rather than holding a copy, and `FIND`/`VERIFY` moved from component
// `useState` to `useFqMode`, which is per session — so the dialog and the sidebar read one mode
// and switching tabs no longer silently resets it.

import React from 'react';
import { Coins, Maximize2 } from 'lucide-react';
import { useQuantStore } from '../../store/useQuantStore';
import { FQ_MULTI_SESSION } from '../../lib/env';
import { FqQueryProvider } from '../../lib/fq/FqQueryProvider';
import SessionTabBarConnected from './session/SessionTabBarConnected';
import { useFqStreamListeners } from './useFqStreamListeners';
import SessionLoadingState from './session/SessionLoadingState';
import {
  useFqAiPlan,
  useFqAnalysisError,
  useFqFinalTrade,
  useFqIsAnalyzing,
  useFqIsSessionHydrating,
  useFqMode,
  useFqReasoningSteps,
  useFqSessionStatus,
} from './useFqSession';
import { useQuantRunActions } from './useQuantRunActions';
import { useTradeStore } from '../../store/useTradeStore';
import TradeQaPanel from './TradeQaPanel';
import ModelSelector from './deep-quant/ModelSelector';
import { useAuthStore } from '../../store/useAuthStore';

// ── Subcomponents ──────────────────────────────────────────────────────
import VerificationForm from './deep-quant/VerificationForm';
import PremiumPaywall from './deep-quant/PremiumPaywall';
import ErrorState from './deep-quant/ErrorState';
import EmptyState from './deep-quant/EmptyState';
import QaMessages from './deep-quant/QaMessages';
import QuantActionBar from './deep-quant/QuantActionBar';
import QuantStatusPill from './deep-quant/QuantStatusPill';
import QuantCompactProgress from './deep-quant/QuantCompactProgress';
import QuantSidebarResult from './deep-quant/QuantSidebarResult';
import DeepQuantAgentDialog from './DeepQuantAgentDialog';
import WatchingIndicator from './deep-quant/WatchingIndicator';
import LoadingState from './deep-quant/LoadingState';
import { useVerificationForm } from './deep-quant/useVerificationForm';
import { useFeature } from '../../store/useFeatureStore';
import { dashboardUrl, openExternalUrl } from '../../lib/redirect';
import { useCredit } from '../../hooks/useApi';
import { bridgeListen } from '../../lib/bridge';

export default function DeepQuantPanel() {
  const user = useAuthStore((s) => s.user);
  const deepseekGlmEnabled = useFeature('deepseekGlm');
  // Live credit balance — LLM usage is billed against the user's plan credits,
  // deducted server-side as OpenRouter usage syncs. Refetched when auth changes.
  const { data: credit } = useCredit();

  const handleUpgrade = async () => {
    await openExternalUrl(dashboardUrl());
  };

  // Actions and global preferences stay on the legacy store; per-session STATE is read through
  // the `useFq*` layer so this component does not know which path is live.
  const selectedModel = useQuantStore((s) => s.selectedModel);
  const setSelectedModel = useQuantStore((s) => s.setSelectedModel);
  const isAnalyzing = useFqIsAnalyzing();
  const isSessionLoading = useFqIsSessionHydrating();
  const analysisError = useFqAnalysisError();
  const reasoningSteps = useFqReasoningSteps();
  const sessionStatus = useFqSessionStatus();
  const finalTrade = useFqFinalTrade();
  // Read only to gate the VERIFY form below, exactly as before. `aiPlan` and `finalTrade` are set
  // together by the DECISION branch, but the condition is left on the field it always used.
  const aiPlan = useFqAiPlan();

  // Both bridge listeners, mounted at the CONTAINER level so they exist before any run starts.
  // (`AgentTerminal` only mounts once a run is in flight, which raced the backend SSE stream and
  // intermittently dropped the opening REASONING/TOOL frames, leaving the glass box blank.)
  //
  // Extracted to a hook because the standalone session route is a different tree and needs the same
  // subscriptions — see `useFqStreamListeners`. Called before the paywall early-return so hook order
  // stays stable.
  useFqStreamListeners();

  // The run controls, shared with the dialog. Holds `symbol`, the candle count, `dataReady` and
  // the FIND/VERIFY handlers — all moved out of this file unchanged.
  const run = useQuantRunActions();
  const { symbol, activeTimeframe, dataReady, insufficientData, symbolCandleCount } = run;

  // Only the setter is used — see the listener note below.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [agentStatus, setAgentStatus] = React.useState<string>('Awaiting trigger...');

  // Per SESSION, not per component. As `useState` here the mode was effectively global and the
  // dialog would have needed its own copy — two controls that could disagree about which mode the
  // next press runs.
  const [activeMode, setActiveMode] = useFqMode();

  // Which surface is on screen, and which row the dialog opens on. `null` = closed.
  const [dialogStepId, setDialogStepId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const openDialog = (stepId: string | null) => {
    setDialogStepId(stepId);
    setDialogOpen(true);
  };

  const livePrice =
    useTradeStore((s) => s.ohlcCandles.find((c) => c.symbol === symbol)?.close) || 0;

  // Use modular verification form hook
  const {
    side,
    setSide,
    entry,
    setEntry,
    setHasManuallySetEntry,
    stopLoss,
    setStopLoss,
    setHasManuallySetSL,
    takeProfit,
    setTakeProfit,
    setHasManuallySetTP,
    userAnalysis,
    setUserAnalysis,
    riskToReward,
    slPercent,
    tpPercent,
  } = useVerificationForm(symbol, livePrice);

  // Kept as it was, INCLUDING the fact that nothing renders `agentStatus`.
  //
  // Nothing on the web path emits this event: there is no `emitBridgeEvent('agent_status', …)`
  // anywhere in `lib/bridge`, so the state is frozen at its initial value — it was a Tauri-era
  // channel. Left in place because whether to remove the listener is a transport question and this
  // change is scoped to presentation. Do NOT wire it into the status row: it would print a stale
  // "Awaiting trigger…" beside a live run.
  React.useEffect(() => {
    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      unlisten = await bridgeListen<string>('agent_status', (event) => {
        console.log(`🧠 [AGENT STATE UPDATE]: ${event.payload}`);
        setAgentStatus(event.payload);
      });
    };
    setupListener();
    return () => {
      unlisten?.();
    };
  }, []);

  // Persist analysis per (symbol, profile): when the active chart symbol OR the
  // workspace mode changes, load that combination's saved session (reasoning,
  // tool calls, decision, Q&A) into the view. A run launched for another
  // symbol/mode keeps streaming into its own session in the background, so
  // switching away and back — across symbols AND across INTRADAY/SWING/INVESTOR/
  // FNO — never wipes or stalls the analysis.
  const activeProfile = useTradeStore((s) => s.activeProfile);
  React.useEffect(() => {
    useQuantStore.getState().activateSymbolSession(symbol, activeProfile);
  }, [symbol, activeProfile]);

  if (!user || !deepseekGlmEnabled) {
    return <PremiumPaywall onUpgradeClick={handleUpgrade} />;
  }

  // The two run entry points. Wrapped rather than passed directly because VERIFY needs the form's
  // current values, which live in this component.
  const handleAIAnalysis = () => run.handleFind();
  const handleVerifyAnalysis = () =>
    run.handleVerify({ side, entry, stopLoss, takeProfit, userAnalysis });
  const handleRun = () => (activeMode === 'FIND' ? handleAIAnalysis() : handleVerifyAnalysis());

  // Whether a session has anything to show. Same condition the panel has always used to decide
  // between the transcript and the empty state.
  const hasRun = reasoningSteps.length > 0 || sessionStatus !== 'idle';

  return (
    <div className="flex h-full flex-col text-sm select-none overflow-hidden">
      {/* ── Session tabs ──────────────────────────────────────
          Flag-gated, and rendered as NOTHING when off — the single-session panel is pixel-unchanged.

          The query provider is mounted per entry point, here and in `SessionWorkspace`, rather than in
          the root layout. An earlier note here claimed two providers would let a tab archived in one
          tree still be listed in the other — that was wrong: this panel and the standalone session
          route are separate PAGES and never mount together. Hoisting was then tried for cache
          continuity across navigation and reverted: it cost 12 kB of shared JS on every page, and what
          has to survive a navigation is the session state in the module-scoped `useSessionStore`, not
          the query cache. See the note in `app/layout.tsx`. */}
      {FQ_MULTI_SESSION && (
        <FqQueryProvider>
          <SessionTabBarConnected />
        </FqQueryProvider>
      )}

      {/* ── Trigger Button ────────────────────────────────── */}
      <div className="shrink-0 p-3 border-b border-border-default relative">
        <QuantActionBar
          mode={activeMode}
          onModeChange={setActiveMode}
          isAnalyzing={isAnalyzing}
          dataReady={dataReady}
          onRun={handleRun}
          onStop={run.cancelAnalysis}
        />

        {/* ── Footer Controls (Responsive 3 equal-width boxes) ── */}
        <div className="mt-2 pt-1.5 border-t border-border-default/20 flex flex-wrap items-center gap-1.5 text-[10px]">
          {/* 1. Model Selector Box */}
          <div className="flex-1 min-w-[110px]">
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={isAnalyzing}
            />
          </div>

          {/* 2. Candle Status Box */}
          <div
            className="flex-1 min-w-[100px] h-7 flex items-center justify-center rounded bg-elevated/35 border border-border-default/60 px-2 py-1 text-[9px] text-text-muted/70 text-center transition-all"
            title={`${symbol} • ${activeTimeframe}`}
          >
            <span className="truncate">
              {symbol} • {activeTimeframe} •{' '}
              {!dataReady
                ? 'Loading…'
                : insufficientData
                  ? `${symbolCandleCount} candles (low)`
                  : `${symbolCandleCount} candles`}
            </span>
          </div>

          {/* 3. Credits Box (Coins icon on left, circular progress ring on right) ── */}
          {credit ? (
            <button
              type="button"
              onClick={handleUpgrade}
              title={
                credit.hasActiveSubscription
                  ? `Plan: ${credit.planName} — ${credit.credits.toLocaleString()} credits remaining`
                  : 'No active plan — click to subscribe'
              }
              className="flex-1 min-w-[100px] h-7 flex items-center justify-between rounded bg-elevated/35 border border-border-default/60 px-2 py-1 text-[10px] transition-all hover:bg-elevated/65 hover:border-border-default/90 cursor-pointer"
            >
              {/* Left: Coin Icon + Credit Number */}
              <div className="flex items-center gap-1.5 min-w-0">
                <Coins size={11} className="text-amber-400 shrink-0" />
                <span className="font-mono font-semibold text-text-primary text-[10px] truncate">
                  {credit.credits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Right: Plan text + Circular Progress Ring */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span className="text-[9px] font-sans font-normal text-text-muted truncate hidden sm:inline">
                  {credit.hasActiveSubscription ? credit.planName : 'no plan'}
                </span>
                <svg className="w-3.5 h-3.5 -rotate-90 shrink-0" viewBox="0 0 14 14">
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="text-border-default/50"
                  />
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeDasharray={31.4}
                    strokeDashoffset={
                      31.4 -
                      (31.4 * Math.min(100, Math.max(10, (credit.credits / 100) * 100))) / 100
                    }
                    strokeLinecap="round"
                    className={
                      credit.credits > 0
                        ? 'text-emerald-400 transition-all duration-300'
                        : 'text-amber-500'
                    }
                  />
                </svg>
              </div>
            </button>
          ) : (
            <div className="flex-1 min-w-[100px]" />
          )}
        </div>
      </div>

      {/* ── Verification Input Form ── */}
      {activeMode === 'VERIFY' && !isAnalyzing && !aiPlan && !analysisError && (
        <VerificationForm
          side={side}
          setSide={setSide}
          entry={entry}
          setEntry={setEntry}
          setHasManuallySetEntry={setHasManuallySetEntry}
          stopLoss={stopLoss}
          setStopLoss={setStopLoss}
          setHasManuallySetSL={setHasManuallySetSL}
          takeProfit={takeProfit}
          setTakeProfit={setTakeProfit}
          setHasManuallySetTP={setHasManuallySetTP}
          userAnalysis={userAnalysis}
          setUserAnalysis={setUserAnalysis}
          slPercent={slPercent}
          tpPercent={tpPercent}
          riskToReward={riskToReward}
          onSubmit={handleVerifyAnalysis}
          isAnalyzing={isAnalyzing}
          dataReady={dataReady}
        />
      )}

      {/* ── Status row ──────────────────────────────────────
          The one line that answers "is it running". Deliberately just the pill and the way in:
          `agentStatus` is NOT shown beside it, because nothing on the web path emits
          `agent_status` — no `emitBridgeEvent('agent_status', …)` exists anywhere in `lib/bridge`,
          so that state is frozen at its initial "Awaiting trigger..." and would render as
          "Analysing · Awaiting trigger…" mid-run. Which step is live is answered honestly by the
          progress list below, from real frames. */}
      <div className="shrink-0 flex items-center justify-between border-b border-border-default/40 px-3 py-1.5">
        <QuantStatusPill status={sessionStatus} />

        {/* Mode Switcher: Chat Mode <-> Agent Mode */}
        <div className="flex items-center rounded-md bg-elevated/40 p-0.5 border border-border-default/60 text-[9px] font-bold uppercase tracking-wider">
          <span className="rounded px-2 py-0.5 bg-elevated text-text-primary shadow-xs">Chat</span>
          <button
            type="button"
            onClick={() => openDialog(finalTrade ? 'decision' : null)}
            aria-label="Open full analysis"
            title="Switch to Agent Mode (Dialog View)"
            className="rounded px-2 py-0.5 text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Agent Mode</span>
            <Maximize2 size={10} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Content Area ──────────────────────────────────── */}
      {/* A flex column: ONLY the progress/result region scrolls; the Q&A composer is pinned as a
          fixed footer so the input never scrolls away. */}
      <div className="flex-grow flex-shrink min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col">
          {isSessionLoading ? (
            <SessionLoadingState variant="compact" symbol={symbol} />
          ) : hasRun ? (
            <>
              {/* Phased radar sweep & loading theatre while awaiting first reasoning step */}
              {reasoningSteps.length === 0 && sessionStatus === 'running' && (
                <LoadingState />
              )}

              {/* Dedicated watching state indicator */}
              {sessionStatus === 'watching' && (
                <div className="px-2 my-1">
                  <WatchingIndicator />
                </div>
              )}

              {/* The committed trade plan renders FIRST when complete/watching so it's 100% visible without scrolling */}
              {(sessionStatus === 'complete' || sessionStatus === 'watching') && (
                <QuantSidebarResult
                  finalTrade={finalTrade}
                  onOpenFullAnalysis={() => openDialog('decision')}
                />
              )}

              {/* Condensed progress — live streaming while running, collapsed telemetry summary when complete */}
              <QuantCompactProgress
                reasoningSteps={reasoningSteps}
                sessionStatus={sessionStatus}
                finalTrade={finalTrade}
                onSelect={(stepId) => openDialog(stepId)}
              />

              {reasoningSteps.length === 0 && sessionStatus === 'complete' && (
                <div className="mx-2 my-2 rounded border border-amber-500/25 bg-amber-500/5 px-2.5 py-2">
                  <p className="text-[10px] font-bold text-amber-500">No reasoning was streamed</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-amber-600 dark:text-amber-300/80">
                    The agent run completed but produced no visible reasoning, tool, or decision
                    steps. Press <span className="font-bold">Find Quant Trade</span> again to retry.
                  </p>
                </div>
              )}

              {/* The existing error card, with the existing strings and the existing Retry gate. */}
              {sessionStatus === 'error' && analysisError && (
                <ErrorState
                  error={analysisError}
                  dataReady={dataReady}
                  activeMode={activeMode}
                  onRetryFind={handleAIAnalysis}
                  onRetryVerify={handleVerifyAnalysis}
                />
              )}

              {/* Q&A turns stay HERE as well as in the dialog, and that is not an oversight: the
                  composer below is in the sidebar, so an answer that only appeared in the Agent View
                  would make asking from here look like nothing happened. What the redesign moves out
                  of this column is the AGENT's reasoning and tool output — the user's own
                  conversation is what they asked for, so it stays where they asked. Same component,
                  same store, so the two surfaces show one thread. */}
              <QaMessages />
            </>
          ) : analysisError ? (
            <ErrorState
              error={analysisError}
              dataReady={dataReady}
              activeMode={activeMode}
              onRetryFind={handleAIAnalysis}
              onRetryVerify={handleVerifyAnalysis}
            />
          ) : (
            <EmptyState symbol={symbol} compact />
          )}
        </div>

        {/* ── Pinned unified Q&A composer — sits OUTSIDE the scroll region so it
            stays fixed at the bottom of the agent section. It renders whenever a
            session is active (disabled during the run) and unlocks the moment the
            agent hits the AI-watcher state, letting the user chat while the AI
            keeps watching for the price trigger. */}
        {hasRun && (
          <div className="shrink-0">
            <TradeQaPanel />
          </div>
        )}
      </div>

      {/* ── AGENT VIEW ──────────────────────────────────────
          Mounted only while open, so the dialog's `AgentTerminal` and composer do not subscribe to
          the store behind a closed overlay. Both surfaces read the same hooks, so no state is
          handed across — only which row to open on. */}
      {dialogOpen && (
        <DeepQuantAgentDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          initialSelectedId={dialogStepId}
          mode={activeMode}
          onModeChange={setActiveMode}
          run={run}
          onRetry={handleRun}
          verificationForm={{
            side,
            setSide,
            entry,
            setEntry,
            setHasManuallySetEntry,
            stopLoss,
            setStopLoss,
            setHasManuallySetSL,
            takeProfit,
            setTakeProfit,
            setHasManuallySetTP,
            userAnalysis,
            setUserAnalysis,
            slPercent,
            tpPercent,
            riskToReward,
            onSubmit: handleVerifyAnalysis,
          }}
        />
      )}
    </div>
  );
}
