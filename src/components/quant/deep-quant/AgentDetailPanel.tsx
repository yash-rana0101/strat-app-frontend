'use client';

// components/quant/deep-quant/AgentDetailPanel.tsx
//
// The Agent View's right-hand column: visual trade intelligence dashboard,
// interactive price ladder, conviction gauge, confluence matrix, and rich tool inspector.

import React from 'react';
import { Target, Wrench, ShieldAlert, Sparkles, Layers } from 'lucide-react';

import {
  isActionableTrade,
  type AiExecutionPlan,
  type ReasoningStep,
  useQuantStore,
} from '../../../store/useQuantStore';
import WatchingIndicator from './WatchingIndicator';
import ConvictionGauge from '../visuals/ConvictionGauge';
import PriceLadderBar from '../visuals/PriceLadderBar';
import ConfluenceMatrix from '../visuals/ConfluenceMatrix';
import StructuredAnalysisCards from '../visuals/StructuredAnalysisCards';
import ToolResultVisualizer from '../visuals/ToolResultVisualizer';

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
  if (!step && !finalTrade) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        {sessionStatus === 'watching' && (
          <div className="w-full mb-4 text-left">
            <WatchingIndicator />
          </div>
        )}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-elevated/60 border border-border-default mb-3">
          <Layers size={20} className="text-text-muted" />
        </div>
        <p className="max-w-64 text-xs font-semibold text-text-primary">
          Deep Quant Visual Inspector
        </p>
        <p className="max-w-64 text-[11px] leading-relaxed text-text-muted mt-1">
          Pick any step in the transcript or progress timeline to inspect visual data, indicators,
          and execution logic.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans divide-y divide-border-default/40">
      {sessionStatus === 'watching' && (
        <div className="p-4 pb-0">
          <WatchingIndicator />
        </div>
      )}

      {/* Selected Tool Inspector Section */}
      {step && (
        <div className="p-4">
          <ToolDetail step={step} resultContent={resultContent} />
        </div>
      )}

      {/* Final Decision / Trade Setup Visual Dashboard */}
      {finalTrade && (
        <div className="p-4">
          <DecisionDetail finalTrade={finalTrade} symbol={symbol} />
        </div>
      )}
    </div>
  );
}

// ── Tool detail ───────────────────────────────────────────────────────────────

function ToolDetail({
  step,
  resultContent,
}: {
  step: ReasoningStep;
  resultContent: string | null;
}) {
  const toolName = step.toolName ? step.toolName.replace(/_/g, ' ') : 'Tool Inspection';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-border-default/40 pb-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-text-primary">
          <Wrench size={12} className="text-primary" />
          <span>{toolName}</span>
        </h3>
        <span className="text-[8.5px] font-mono text-text-muted uppercase">Step Telemetry</span>
      </div>

      <ToolResultVisualizer
        toolName={step.toolName || 'tool'}
        args={step.args}
        resultContent={resultContent}
      />
    </div>
  );
}

// ── Decision detail ───────────────────────────────────────────────────────────

function DecisionDetail({ finalTrade, symbol }: { finalTrade: AiExecutionPlan; symbol: string }) {
  const actionable = isActionableTrade(finalTrade);
  const side = finalTrade.action ?? 'HOLD';
  const isBuy = side === 'BUY';
  const consensusData = useQuantStore((s) => s.consensusData);

  // ── Stand Aside Visual Card ───────────────────────────────────────────────
  if (!actionable) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default/40 pb-2">
          <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-400">
            <ShieldAlert size={13} />
            <span>Stand Aside — Risk Guard</span>
          </h3>
          <span className="rounded px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25">
            CAPITAL PRESERVATION
          </span>
        </div>

        {/* Hero Card */}
        <div className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-elevated/40 to-elevated/10 p-3.5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-text-muted">
                Market Condition
              </span>
              <span className="block text-base font-black text-amber-400">
                No High-Conviction Setup
              </span>
            </div>

            <ConvictionGauge
              score={finalTrade.conviction_score}
              action="HOLD"
              tier="stand_aside"
              size="md"
              showLabel={true}
            />
          </div>
        </div>

        {/* Consensus Indicators */}
        <ConfluenceMatrix consensus={consensusData} />

        {/* Structured Analysis */}
        <StructuredAnalysisCards
          setupValidation={finalTrade.setup_validation}
          executionPlan={finalTrade.execution_plan}
        />
      </div>
    );
  }

  // ── Actionable Trade Setup Visual Dashboard ────────────────────────────────
  const { entry, take_profit: target, stop_loss: stopLoss } = finalTrade.execution_levels;

  return (
    <div className="space-y-4">
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-border-default/40 pb-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-400">
          <Sparkles size={12} />
          <span>Committed Trade Plan</span>
        </h3>
        <span
          className={`rounded px-2 py-0.5 text-[8.5px] font-black uppercase tracking-widest border ${
            isBuy
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/25'
          }`}
        >
          {side} {symbol}
        </span>
      </div>

      {/* Hero Decision Tile */}
      <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 via-elevated/40 to-elevated/10 p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-text-muted">
              Directional Setup
            </span>
            <span
              className={`text-2xl font-black tracking-tight ${
                isBuy ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {side} {symbol}
            </span>
          </div>

          <ConvictionGauge
            score={finalTrade.conviction_score}
            action={side}
            tier={finalTrade.opportunity_tier}
            size="md"
            showLabel={true}
          />
        </div>
      </div>

      {/* Interactive Price Ladder & Visual Risk-Reward Bar */}
      <PriceLadderBar
        entry={entry}
        target={target}
        stopLoss={stopLoss}
        side={side === 'BUY' || side === 'SELL' ? side : undefined}
        compact={false}
      />

      {/* Market Confluence Matrix */}
      <ConfluenceMatrix consensus={consensusData} />

      {/* Structured Analysis Cards (Catalysts, Invalidation, Milestones) */}
      <StructuredAnalysisCards
        setupValidation={finalTrade.setup_validation}
        executionPlan={finalTrade.execution_plan}
      />
    </div>
  );
}
