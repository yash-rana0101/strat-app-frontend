'use client';

// components/quant/deep-quant/QuantSidebarResult.tsx
//
// The visual result card for Chat Mode: high-impact visual representation
// of the agent's decision, entry/target/stop price ladder, conviction gauge,
// and risk/reward payoff.

import React from 'react';
import { ArrowRight, ShieldAlert } from 'lucide-react';

import { isActionableTrade, type AiExecutionPlan } from '../../../store/useQuantStore';
import ConvictionGauge from '../visuals/ConvictionGauge';
import PriceLadderBar from '../visuals/PriceLadderBar';

interface QuantSidebarResultProps {
  finalTrade: AiExecutionPlan | null;
  onOpenFullAnalysis: () => void;
}

export default function QuantSidebarResult({
  finalTrade,
  onOpenFullAnalysis,
}: QuantSidebarResultProps) {
  if (!finalTrade) return null;

  const actionable = isActionableTrade(finalTrade);

  // ── Stand aside / Risk Guard ──────────────────────────────────────────────
  if (!actionable) {
    const actionLabel = finalTrade.action ? String(finalTrade.action).toUpperCase() : 'NO TRADE';

    return (
      <div className="mx-2 mb-2 rounded-lg border border-amber-500/25 bg-amber-500/5 font-sans overflow-hidden animate-fade-in shadow-sm">
        <div className="flex items-center justify-between border-b border-amber-500/20 px-3 py-2 bg-amber-500/10 select-none">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="shrink-0 text-amber-400" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
              Risk Guard — Stand Aside
            </span>
          </div>
          <span className="rounded px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider bg-elevated text-amber-400 border border-amber-500/30">
            {actionLabel}
          </span>
        </div>

        <div className="p-3 flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">
              Decision Bias
            </span>
            <span className="text-[11px] font-bold text-text-primary mt-0.5">
              Capital Preservation
            </span>
          </div>

          <ConvictionGauge
            score={finalTrade.conviction_score}
            action="HOLD"
            tier="stand_aside"
            size="sm"
            showLabel={true}
          />
        </div>

        <FullAnalysisButton onClick={onOpenFullAnalysis} />
      </div>
    );
  }

  // ── Actionable Directional Trade ──────────────────────────────────────────
  const side = finalTrade.action === 'SELL' ? 'SELL' : 'BUY';
  const isBuy = side === 'BUY';
  const { entry, take_profit: target, stop_loss: stop } = finalTrade.execution_levels;

  return (
    <div className="mx-2 mb-2 rounded-lg border border-border-default bg-surface font-sans overflow-hidden animate-fade-in shadow-sm">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-border-default/60 px-3 py-2 bg-elevated/20 select-none">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-widest border ${
              isBuy
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBuy ? 'bg-emerald-400' : 'bg-rose-400'
              } animate-pulse`}
            />
            {side} SETUP
          </span>
        </div>

        <ConvictionGauge
          score={finalTrade.conviction_score}
          action={side}
          tier={finalTrade.opportunity_tier}
          size="sm"
          showLabel={true}
        />
      </div>

      {/* Hero Visual Section: Compact Price Ladder */}
      <div className="p-3">
        <PriceLadderBar
          entry={entry}
          target={target}
          stopLoss={stop}
          side={side}
          compact={true}
        />
      </div>

      <FullAnalysisButton onClick={onOpenFullAnalysis} />
    </div>
  );
}

function FullAnalysisButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 border-t border-border-default/40 px-3 py-2 text-[9.5px] font-bold uppercase tracking-wider text-text-secondary transition-all hover:bg-elevated hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
    >
      <span>Open Full Reasoning & Visuals</span>
      <ArrowRight size={11} aria-hidden="true" />
    </button>
  );
}
