'use client';

// components/quant/deep-quant/QuantSidebarResult.tsx
//
// The compact result card: what was decided, and the way into the full reasoning.
//
// It answers the sidebar's job — action, conviction, entry/target/stop — and deliberately stops
// there. The `setup_validation` paragraph, the execution plan and the tool output stay in the
// Agent View, because putting them here is what made the panel unusable.
//
// Every number comes off the plan the backend committed. `isActionableTrade` is the SAME shared
// guard the transcript uses, so a HOLD / stand_aside / level-less decision renders the honest
// no-trade card here rather than a card with fabricated prices.

import React from 'react';
import { ArrowRight, Shield } from 'lucide-react';

import { isActionableTrade, type AiExecutionPlan } from '../../../store/useQuantStore';

interface QuantSidebarResultProps {
  finalTrade: AiExecutionPlan | null;
  onOpenFullAnalysis: () => void;
}

export default function QuantSidebarResult({
  finalTrade,
  onOpenFullAnalysis,
}: QuantSidebarResultProps) {
  if (!finalTrade) return null;

  const conviction =
    typeof finalTrade.conviction_score === 'number' ? `${finalTrade.conviction_score}%` : '—';

  // ── Stand aside ───────────────────────────────────────────────────────────
  // No levels exist, so none are shown. An empty entry/target/stop grid would read as a trade
  // whose prices failed to load rather than a decision not to trade.
  if (!isActionableTrade(finalTrade)) {
    return (
      <div className="mx-2 mb-2 rounded border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-1.5 border-b border-border-default/40 px-2.5 py-2">
          <Shield size={11} className="shrink-0 text-amber-500" aria-hidden="true" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500">
            Stand Aside — No Trade
          </span>
        </div>
        <div className="px-2.5 py-2">
          <p className="line-clamp-3 text-[10px] leading-relaxed text-text-secondary">
            {finalTrade.setup_validation || 'The agent did not commit a directional trade.'}
          </p>
        </div>
        <FullAnalysisButton onClick={onOpenFullAnalysis} />
      </div>
    );
  }

  const side = finalTrade.action === 'SELL' ? 'SELL' : 'BUY';
  const { entry, take_profit: target, stop_loss: stop } = finalTrade.execution_levels;

  return (
    <div className="mx-2 mb-2 rounded border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent">
      <div className="flex items-center gap-1.5 border-b border-border-default/40 px-2.5 py-2">
        <Shield size={11} className="shrink-0 text-emerald-500" aria-hidden="true" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">
          Actionable Trade
        </span>
      </div>

      {/* Action + conviction, the two facts read first. */}
      <div className="flex items-baseline justify-between px-2.5 pt-2.5">
        <span
          className={`text-lg font-black tracking-tight ${
            side === 'SELL' ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {side}
        </span>
        <span className="font-mono text-xs font-bold text-text-primary">{conviction}</span>
      </div>

      {/* Levels, label-left / value-right so the three prices align in a narrow column. */}
      <dl className="mt-2 flex flex-col gap-1 px-2.5 pb-2">
        <Level label="Entry" value={entry} />
        <Level label="Target" value={target} tone="text-emerald-400" />
        <Level label="Stop Loss" value={stop} tone="text-rose-400" />
      </dl>

      <FullAnalysisButton onClick={onOpenFullAnalysis} />
    </div>
  );
}

function Level({ label, value, tone = 'text-text-primary' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className={`font-mono text-[11px] font-bold ${tone}`}>₹{value.toFixed(2)}</dd>
    </div>
  );
}

function FullAnalysisButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 border-t border-border-default/40 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
    >
      View Full Analysis
      <ArrowRight size={11} aria-hidden="true" />
    </button>
  );
}
