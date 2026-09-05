'use client';

// components/quant/deep-quant/QuantSidebarResult.tsx
//
// The visual result card for Chat Mode: high-impact visual representation
// of the agent's decision, entry/target/stop price ladder, conviction gauge,
// and risk/reward payoff.

import React from 'react';
import { ArrowRight, Shield, ShieldAlert, Sparkles } from 'lucide-react';

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
    return (
      <div className="mx-2 mb-2 rounded-xl border border-amber-500/25 bg-gradient-to-b from-amber-500/10 via-elevated/40 to-elevated/20 shadow-md font-sans overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between border-b border-amber-500/20 px-3 py-2 bg-amber-500/5">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} className="shrink-0 text-amber-400" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Risk Guard — Stand Aside
            </span>
          </div>
          <span className="rounded px-1.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            NO TRADE
          </span>
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-center gap-3">
            <ConvictionGauge
              score={finalTrade.conviction_score}
              action="HOLD"
              tier="stand_aside"
              size="sm"
              showLabel={false}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
                Decision Bias
              </span>
              <span className="text-[11px] font-extrabold text-amber-400">
                Capital Preservation
              </span>
            </div>
          </div>

          <p className="line-clamp-3 text-[10px] leading-relaxed text-text-secondary border-l-2 border-amber-500/30 pl-2 italic">
            {finalTrade.setup_validation || 'The agent identified unfavorable risk-to-reward or conflicting market signals.'}
          </p>
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
    <div className="mx-2 mb-2 rounded-xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 via-elevated/50 to-elevated/20 shadow-lg font-sans overflow-hidden animate-fade-in">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 px-3 py-2 bg-emerald-500/5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="shrink-0 text-emerald-400" aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
            Quant Trade Setup Ready
          </span>
        </div>
        <span
          className={`rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
            isBuy
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          {side} SETUP
        </span>
      </div>

      {/* Hero Visual Section: Action + Radial Conviction Gauge */}
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-text-muted">
              Directional Bias
            </span>
            <span
              className={`text-xl font-black tracking-tight ${
                isBuy ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {side} ORDER
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

        {/* Compact Price Ladder & Visual Risk-Reward Bar */}
        <div className="pt-2 border-t border-border-default/40">
          <PriceLadderBar
            entry={entry}
            target={target}
            stopLoss={stop}
            side={side}
            compact={true}
          />
        </div>
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
      className="flex w-full items-center justify-center gap-1.5 border-t border-border-default/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-all hover:bg-elevated hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
    >
      <span>Open Full Reasoning & Visuals</span>
      <ArrowRight size={11} aria-hidden="true" />
    </button>
  );
}
