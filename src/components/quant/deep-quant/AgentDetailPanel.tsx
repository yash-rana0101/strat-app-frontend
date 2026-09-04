'use client';

// components/quant/deep-quant/AgentDetailPanel.tsx
//  push to new one
// The Agent View's right-hand column: the selected step, and the committed plan, in full.
//
// This is where the text that used to crush the sidebar belongs. `setup_validation` and the
// execution plan render UNTRUNCATED and unaltered — no clamp, no summarising — because the
// sidebar's compact card exists precisely so this one can be complete.
//
// Nothing is computed here. Action, conviction and the three prices are read off the plan the
// backend committed; a missing field renders "—" rather than a derived stand-in, and there is no
// frontend-calculated risk/reward. `isActionableTrade` is the SAME shared guard the transcript
// uses, so a HOLD / stand_aside / level-less decision shows the honest no-trade heading rather
// than a grid of fabricated prices.
//
// NOT built on `AiExecutionPlanView`, deliberately. That component renders conviction + the two
// prose blocks and would have been the obvious reuse, but it is unreachable in the current panel
// (its branch sits behind `aiPlan`, which cannot be set without `reasoningSteps.length > 0`, so
// the transcript branch always won) and its `Clear & Reset` button calls `clearAiPlan`, which
// writes the legacy flat store fields and does nothing on the multi-session path. Mounting it here
// would have put a dead control in front of the user.

import React from 'react';
import { Target, Wrench } from 'lucide-react';

import { isActionableTrade, type AiExecutionPlan, type ReasoningStep, useQuantStore } from '../../../store/useQuantStore';
import { formatToolName } from './agentTimeline';
import { highlightNumbers } from './textHighlighter';
import MarkdownRenderer from './MarkdownRenderer';
import WatchingIndicator from './WatchingIndicator';

interface AgentDetailPanelProps {
  /** The tool step being inspected, or null when nothing but the decision is selected. */
  step: ReasoningStep | null;
  finalTrade: AiExecutionPlan | null;
  /** The `tool_end` content paired with `step`, when the stream carried one. */
  resultContent: string | null;
  symbol?: string;
  sessionStatus?: string;
}

export default function AgentDetailPanel({
  step,
  finalTrade,
  resultContent,
  symbol = '',
  sessionStatus,
}: AgentDetailPanelProps) {
  // The trade section renders whenever a plan exists, whether or not a tool step is also selected.
  // Making it the "else" branch meant clicking any step made the trade disappear from the dialog —
  // and the transcript no longer carries the plan card here (`showTradePlan={false}`), so this
  // column is the only place those levels appear.
  if (!step && !finalTrade) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        {sessionStatus === 'watching' && (
          <div className="w-full mb-4 text-left">
            <WatchingIndicator />
          </div>
        )}
        <p className="max-w-60 text-[11px] leading-relaxed text-text-muted">
          Pick a step on the left to see exactly what the agent called and what came back.
        </p>
      </div>
    );
  }

  return (
    <>
      {sessionStatus === 'watching' && (
        <div className="p-4 pb-0">
          <WatchingIndicator />
        </div>
      )}
      {step && <ToolDetail step={step} resultContent={resultContent} />}
      {finalTrade && (
        <div className={step ? 'border-t border-border-default/40' : ''}>
          <DecisionDetail finalTrade={finalTrade} symbol={symbol} />
        </div>
      )}
    </>
  );
}

// ── Tool detail ───────────────────────────────────────────────────────────────

function ToolDetail({ step, resultContent }: { step: ReasoningStep; resultContent: string | null }) {
  const argEntries = Object.entries(step.args ?? {});

  return (
    <div className="flex flex-col gap-3 p-4">
      <Heading icon={<Wrench size={11} aria-hidden="true" />}>{formatToolName(step.toolName)}</Heading>

      {argEntries.length > 0 ? (
        <div>
          <Label>Arguments</Label>
          {/* EVERY argument, not the short allowlist the progress rows use. Someone reading this
              panel is asking exactly what the tool was called with. */}
          <dl className="mt-1.5 flex flex-col gap-1 rounded border border-border-default/50 bg-elevated/20 p-2.5">
            {argEntries.map(([key, value]) => (
              <div key={key} className="flex gap-2 text-[10px] leading-relaxed">
                <dt className="shrink-0 font-semibold text-text-muted">{key}</dt>
                <dd className="min-w-0 flex-1 break-all text-text-secondary">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="text-[10px] text-text-muted">This tool was called with no arguments.</p>
      )}

      {resultContent && (
        <div>
          <Label>Result</Label>
          <div className="mt-1.5 rounded border border-border-default/50 bg-elevated/20 p-2.5 text-[10.5px] leading-relaxed text-text-secondary">
            <MarkdownRenderer content={resultContent} simple />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Decision detail ───────────────────────────────────────────────────────────

function DecisionDetail({ finalTrade, symbol }: { finalTrade: AiExecutionPlan; symbol: string }) {
  const actionable = isActionableTrade(finalTrade);
  const side = finalTrade.action ?? '—';
  const conviction =
    typeof finalTrade.conviction_score === 'number' ? `${finalTrade.conviction_score}%` : '—';
  const consensusReport = useQuantStore((s) => s.consensusData);
  const atr = consensusReport?.atr_14 != null ? consensusReport.atr_14.toFixed(2) : null;
  // Read existing calculated risk/reward if provided
  const tradeRecord = finalTrade as unknown as Record<string, unknown>;
  const riskReward = tradeRecord.risk_reward ? String(tradeRecord.risk_reward) : null;

  return (
    <div className="flex flex-col gap-3 p-4">
      <Heading icon={<Target size={11} aria-hidden="true" />}>
        {actionable ? 'Declare Trade' : 'Stand Aside — No Trade'}
      </Heading>

      {/* Prominent Trade Plan Section matching the spec */}
      {actionable ? (
        <div className="rounded border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-3">
          <div className="flex items-baseline justify-between mb-2">
            <span
              className={`text-base font-black tracking-tight ${
                side === 'SELL' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {side} {symbol}
            </span>
            <span className="font-mono text-xs font-bold text-text-primary">
              {conviction} CONVICTION
            </span>
          </div>

          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded border border-border-default/50 bg-border-default/40">
            <Metric label="Entry" value={`₹${finalTrade.execution_levels.entry.toFixed(2)}`} />
            <Metric
              label="Target"
              value={`₹${finalTrade.execution_levels.take_profit.toFixed(2)}`}
              tone="text-emerald-400"
            />
            <Metric
              label="Stop Loss"
              value={`₹${finalTrade.execution_levels.stop_loss.toFixed(2)}`}
              tone="text-rose-400"
            />
            <Metric label="Conviction" value={conviction} />
            {atr && <Metric label="ATR" value={atr} />}
            {riskReward && <Metric label="Risk / Reward" value={riskReward} />}
            {finalTrade.opportunity_tier && <Metric label="Tier" value={finalTrade.opportunity_tier} />}
          </dl>
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border-default/50 bg-border-default/40">
          <Metric
            label="Action"
            value={side}
            tone={side === 'SELL' ? 'text-rose-400' : side === 'BUY' ? 'text-emerald-400' : undefined}
          />
          <Metric label="Conviction" value={conviction} />
          {finalTrade.opportunity_tier && <Metric label="Tier" value={finalTrade.opportunity_tier} />}
        </dl>
      )}

      {/* IN FULL. This is the whole reason the dialog exists — no line clamp, and
          `whitespace-pre-line` so the model's own paragraphing survives. */}
      {finalTrade.setup_validation && (
        <div>
          <Label>Setup Validation</Label>
          <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-text-secondary">
            {highlightNumbers(finalTrade.setup_validation)}
          </p>
        </div>
      )}

      {finalTrade.execution_plan && (
        <div>
          <Label>Execution Plan</Label>
          <div className="mt-1.5 rounded border border-border-default/50 bg-elevated/20 p-2.5">
            <p className="whitespace-pre-line text-[11px] leading-relaxed text-text-secondary">
              {highlightNumbers(finalTrade.execution_plan)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small shared bits ─────────────────────────────────────────────────────────

function Heading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-primary">
      <span className="text-text-muted">{icon}</span>
      {children}
    </h3>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{children}</span>
  );
}

function Metric({
  label,
  value,
  tone = 'text-text-primary',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-surface px-2.5 py-2">
      <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
      <span className={`font-mono text-xs font-bold ${tone}`}>{value}</span>
    </div>
  );
}
