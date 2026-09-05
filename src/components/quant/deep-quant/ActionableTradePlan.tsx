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
      <div className="w-full rounded-lg border border-border-default bg-surface overflow-hidden">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-default/60 bg-elevated/20 select-none">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-elevated text-emerald-500">
              <Sparkles size={13} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Actionable Trade Setup Confirmed
              </h3>
              <span className="text-[9px] text-text-muted">
                Microstructure & quantitative consensus aligned
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${
                isBuy
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {side} SIGNAL
            </span>
          </div>
        </div>

        {/* Hero Metrics Strip: Direction + Conviction Gauge */}
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-elevated/30 rounded-lg p-3 border border-border-default/60">
            <div className="flex flex-col">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">
                Order Recommendation
              </span>
              <span
                className={`text-xl font-bold tracking-tight mt-0.5 ${
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
