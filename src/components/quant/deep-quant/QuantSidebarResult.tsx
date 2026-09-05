'use client';

// components/quant/deep-quant/QuantSidebarResult.tsx
//
// The visual result card for Chat Mode: high-impact visual representation
// of the committed trade plan, directional setup, conviction gauge,
// execution ladder, and structured analysis accordions.

import React from 'react';
import { ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

import { isActionableTrade, type AiExecutionPlan } from '../../../store/useQuantStore';
import ConvictionGauge from '../visuals/ConvictionGauge';
import PriceLadderBar from '../visuals/PriceLadderBar';
import StructuredAnalysisCards from '../visuals/StructuredAnalysisCards';

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
      <div className="mx-2 mb-2 rounded-lg border border-amber-500/25 bg-amber-500/5 font-sans overflow-hidden animate-fade-in shadow-sm select-text">
        <div className="flex items-center justify-between border-b border-amber-500/20 px-3 py-2 bg-amber-500/10 select-none">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="shrink-0 text-amber-400" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
              Stand Aside — Risk Guard
            </span>
          </div>
          <span className="rounded px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider bg-elevated text-amber-400 border border-amber-500/30">
            {actionLabel}
          </span>
        </div>

        <div className="p-3 flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
              Decision Bias
            </span>
            <span className="text-[12px] font-extrabold text-text-primary mt-0.5">
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

        {/* Structured Analysis (Flat accordions, NO nested box) */}
        <div className="px-3 pb-2 border-t border-amber-500/15">
          <StructuredAnalysisCards
            setupValidation={finalTrade.setup_validation}
            executionPlan={finalTrade.execution_plan}
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
    <div className="mx-2 mb-2 rounded-lg border border-border-default/80 bg-surface/95 font-sans overflow-hidden animate-fade-in shadow-sm select-text">
      {/* Top Banner (Single level container, NO nested box) */}
      <div className="flex items-center justify-between border-b border-border-default/40 px-3 py-2 bg-elevated/20 select-none">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="shrink-0 text-emerald-400" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary font-mono">
            Committed Trade Plan
          </span>
        </div>
        <span
          className={`rounded px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest border ${
            isBuy
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          }`}
        >
          {side} SETUP
        </span>
      </div>

      {/* Hero Visual Section: Directional Bias & Radial Conviction (Directly on surface) */}
      <div className="px-3 pt-2.5 pb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
            Directional Setup
          </span>
          <span
            className={`text-base font-black tracking-tight mt-0.5 ${
              isBuy ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
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

      {/* Divider */}
      <div className="mx-3 border-t border-border-default/30" />

      {/* Execution Ladder Bar (Unboxed, NO nested box) */}
      <div className="px-3 py-2">
        <PriceLadderBar
          entry={entry}
          target={target}
          stopLoss={stop}
          side={side}
          compact={false}
        />
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-border-default/30" />

      {/* Structured Analysis Cards (Flat accordions, NO nested box) */}
      <div className="px-3 py-1.5">
        <StructuredAnalysisCards
          setupValidation={finalTrade.setup_validation}
          executionPlan={finalTrade.execution_plan}
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
      className="flex w-full items-center justify-center gap-1.5 border-t border-border-default/40 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-text-secondary transition-all hover:bg-elevated hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer select-none"
    >
      <span>Open Full Reasoning & Visuals</span>
      <ArrowRight size={10} aria-hidden="true" />
    </button>
  );
}
