'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2, AlertTriangle, Lock } from 'lucide-react';
import { isActionableTrade } from '../../store/useQuantStore';
import {
  useFqAnalysisError,
  useFqFinalTrade,
  useFqQaMessages,
  useFqQaStatus,
  useFqReasoningSteps,
  useFqSessionStatus,
} from './useFqSession';

import WatchingIndicator from './deep-quant/WatchingIndicator';
import QaMessages from './deep-quant/QaMessages';
import ReasoningStepRenderer from './deep-quant/ReasoningStepRenderer';
import ToolExecutionStep from './deep-quant/ToolExecutionStep';
import ActionableTradePlan from './deep-quant/ActionableTradePlan';
import TerminalStandAsideCard from './deep-quant/TerminalStandAsideCard';
import ThinkingGroupRenderer from './deep-quant/ThinkingGroupRenderer';
import LoadingState from './deep-quant/LoadingState';
import { classifyAgentError } from './deep-quant/agentErrorClassifier';
import { buildRenderGroups } from './deep-quant/agentTimeline';
import type { ReasoningStep } from '../../store/useQuantStore';

interface AgentTerminalProps {
  /**
   * Given by the Agent View, where clicking a tool row opens it in the detail panel. Omitted
   * everywhere else (the sidebar, the standalone session route), which leaves the transcript
   * exactly as it was — see `ToolExecutionStep`, which only becomes a button when this is set.
   */
  onSelectStep?: (step: ReasoningStep) => void;
  selectedStepId?: string | null;
  /**
   * Whether the committed plan card renders inside the transcript.
   *
   * The Agent View shows those same levels in its right-hand detail column, so leaving this on
   * there would print entry/target/stop twice in one dialog. Defaults to TRUE, which is the
   * existing behaviour — and `AgentTerminal.planOrder.test.tsx` pins both that the card renders
   * and that it sits above the Q&A turns.
   */
  showTradePlan?: boolean;
}

export default function AgentTerminal({
  onSelectStep,
  selectedStepId = null,
  showTradePlan = true,
}: AgentTerminalProps = {}) {
  // Read through the `useFq*` layer, not the store directly: it resolves per-session state or
  // the legacy flat fields depending on the rollout flag, so this component holds no knowledge
  // of which one is live. One field per hook, matching the previous selectors exactly — a
  // single hook returning an object would re-render this on every frame of every session.
  const reasoningSteps = useFqReasoningSteps();
  const sessionStatus = useFqSessionStatus();
  const finalTrade = useFqFinalTrade();
  const analysisError = useFqAnalysisError();

  const qaMessages = useFqQaMessages();
  const qaStatus = useFqQaStatus();

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of terminal when reasoningSteps changes
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reasoningSteps, sessionStatus, qaMessages, qaStatus]);

  // Grouping moved to `agentTimeline.buildRenderGroups`, unchanged: the sidebar's condensed
  // progress derives from the same steps and must not disagree with this transcript about what
  // ran. Four property suites pin the behaviour, so there is one copy rather than two.
  const renderGroups = buildRenderGroups(reasoningSteps);

  return (
    <div className="flex h-full flex-col font-sans bg-surface overflow-hidden relative">
      {/* Terminal Scrolling Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-track-slate-950/20 scrollbar-thumb-slate-800 select-text">
        {renderGroups.map((group) => {
          if (group.type === 'thinking_group') {
            return (
              <ThinkingGroupRenderer
                key={group.id}
                steps={group.steps}
                sessionStatus={sessionStatus}
              />
            );
          } else if (group.type === 'decision') {
            return <ReasoningStepRenderer key={group.id} step={group.step} />;
          } else if (group.type === 'tool_start') {
            return (
              <ToolExecutionStep
                key={group.id}
                step={group.step}
                reasoningSteps={reasoningSteps}
                sessionStatus={sessionStatus}
                onSelect={onSelectStep}
                isSelected={selectedStepId === group.id}
              />
            );
          } else {
            return (
              <div key={group.id} className="flex justify-start animate-fade-in font-sans pl-2">
                <div className="text-[10px] text-text-secondary font-semibold select-none flex items-center gap-1.5 py-0.5">
                  <span className="text-text-muted">&gt;</span>
                  {group.step.content}
                </div>
              </div>
            );
          }
        })}

        {/* Watching Indicator inside scroll log */}
        {sessionStatus === 'watching' && <WatchingIndicator />}

        {/* Loading spinner while awaiting first reasoning step */}
        {reasoningSteps.length === 0 && sessionStatus === 'running' && (
          <LoadingState />
        )}

        {reasoningSteps.length === 0 && sessionStatus === 'complete' && (
          <div className="flex items-start gap-3 p-3 bg-surface border border-amber-500/30 rounded-md mt-2 select-text font-sans">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-amber-500/10 text-amber-500 dark:text-amber-400 text-[10px] font-bold select-none mt-0.5">
              !
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400">
                No reasoning was streamed
              </span>
              <span className="text-[10px] text-text-secondary mt-1 leading-relaxed">
                The agent run completed but produced no visible reasoning, tool, or decision steps.
                This usually means the Python agent (:8086) returned an empty response or the stream
                ended early. Press{' '}
                <span className="font-bold text-amber-500 dark:text-amber-200">Find Trade</span>{' '}
                again to retry.
              </span>
              {analysisError && (
                <span className="text-[9px] font-mono text-amber-500 dark:text-amber-400 bg-amber-500/5 rounded-sm border border-amber-500/20 px-2 py-1 mt-2 leading-normal">
                  {analysisError}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Streaming indicator inside console */}
        {sessionStatus === 'running' && (
          <div className="flex items-center gap-2 py-1 pl-1 text-[11px] text-emerald-400/90 select-none">
            <Loader2 size={11} className="animate-spin text-emerald-400 shrink-0" />
            <span className="font-mono tracking-wide">Working...</span>
          </div>
        )}

        {/* Error message display.
            The explanation is DERIVED from the error, not hardcoded — see
            `agentErrorClassifier`. */}
        {sessionStatus === 'error' &&
          (() => {
            const err = classifyAgentError(analysisError);
            const isFault = err.kind !== 'research-locked' && err.kind !== 'feature-disabled';
            const tone = isFault
              ? {
                  wrap: 'bg-rose-500/5 border-rose-500/30',
                  badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
                  title: 'text-rose-400',
                  body: 'text-text-secondary',
                  detail: 'text-rose-400 bg-black/40 border-rose-500/20',
                  glyph: <AlertTriangle size={12} />,
                }
              : {
                  wrap: 'bg-amber-500/5 border-amber-500/30',
                  badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
                  title: 'text-amber-400',
                  body: 'text-text-secondary',
                  detail: 'text-amber-400 bg-black/40 border-amber-500/20',
                  glyph: <Lock size={12} />,
                };

            return (
              <div
                className={`flex flex-col gap-2 p-3 border rounded-md mt-2 select-text font-sans ${tone.wrap}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold select-none ${tone.badge}`}
                  >
                    {tone.glyph}
                  </div>
                  <span className={`text-[11px] font-bold tracking-wide ${tone.title}`}>{err.title}</span>
                </div>
                <span className={`text-[10px] pl-7 leading-relaxed ${tone.body}`}>
                  {err.explanation}
                </span>
                {err.detail && (
                  <details className="pl-7 mt-0.5">
                    <summary className="text-[9px] text-text-muted hover:text-text-secondary cursor-pointer select-none">
                      Technical diagnostic
                    </summary>
                    <span
                      className={`block text-[9px] font-mono rounded border p-1.5 mt-1 leading-normal break-all ${tone.detail}`}
                    >
                      {err.detail}
                    </span>
                  </details>
                )}
              </div>
            );
          })()}

        {/* Stand-Aside decision rendered INLINE in the terminal log */}
        {sessionStatus === 'complete' && finalTrade && !isActionableTrade(finalTrade) && (
          <TerminalStandAsideCard finalTrade={finalTrade} />
        )}

        {/* Actionable trade declaration.
            
            Rendered BEFORE <QaMessages />, not after.
            
            The plan belongs at the point in the conversation where the analysis
            finished — the run's closing statement, with any follow-up Q&A
            appending below it like ordinary chat. It used to render after the
            Q&A list, so every new question and answer was inserted ABOVE it and
            the plan slid to the bottom of the log each time: it read as a
            pinned footer stuck under whatever was said last, detached from the
            run that produced it, and the stand-aside branch above already
            rendered inline this way while this branch did not. Ordering is the
            whole fix — both blocks are plain flow children, neither is
            position: sticky. */}
        {sessionStatus === 'complete' && isActionableTrade(finalTrade) && showTradePlan && (
          <ActionableTradePlan finalTrade={finalTrade} />
        )}

        {/* Follow-up Q&A turns render INLINE, after the plan they ask about. */}
        <QaMessages />

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
