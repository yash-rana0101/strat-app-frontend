'use client';

import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { AiExecutionPlan, ExecutionLevels } from '../../../store/useQuantStore';
import ConvictionGauge from '../visuals/ConvictionGauge';
import PriceLadderBar from '../visuals/PriceLadderBar';
import StructuredAnalysisCards from '../visuals/StructuredAnalysisCards';

interface ActionableTradePlanProps {
  finalTrade: AiExecutionPlan & { execution_levels: ExecutionLevels };
}

export default function ActionableTradePlan({ finalTrade }: ActionableTradePlanProps) {
  const side = finalTrade.action === 'SELL' ? 'SELL' : 'BUY';
  const isBuy = side === 'BUY';
  const { entry, take_profit: target, stop_loss: stopLoss } = finalTrade.execution_levels;

  return (
    <div className="flex justify-start animate-fade-in font-sans w-full my-3 select-text">
      <div className="w-full rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 via-elevated/40 to-elevated/20 shadow-xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5 select-none">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
              <Sparkles size={13} />
            </div>
            <div>
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                Actionable Trade Setup Confirmed
              </h3>
              <span className="text-[9px] text-text-muted">
                Microstructure & quantitative consensus aligned
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2.5 py-1 text-[10px] font-black tracking-widest uppercase border ${
                isBuy
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            >
              {side} SIGNAL
            </span>
          </div>
        </div>

        {/* Hero Metrics Strip: Direction + Conviction Gauge */}
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface/60 rounded-xl p-3 border border-border-default/50">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
                Order Recommendation
              </span>
              <span
                className={`text-2xl font-black tracking-tight ${
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
              size="md"
              showLabel={true}
            />
          </div>

          {/* Full Price Ladder & Visual Risk-Reward Payoff */}
          <PriceLadderBar
            entry={entry}
            target={target}
            stopLoss={stopLoss}
            side={side}
            compact={false}
          />

          {/* Structured Analysis Cards (Catalysts, Invalidation, Milestones) */}
          <StructuredAnalysisCards
            setupValidation={finalTrade.setup_validation}
            executionPlan={finalTrade.execution_plan}
          />
        </div>
      </div>
    </div>
  );
}
