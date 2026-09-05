'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
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
    <div className="flex justify-start animate-fade-in font-sans w-full my-2 select-text">
      <div className="w-full rounded-lg border border-border-default/80 bg-surface/90 overflow-hidden shadow-sm">
        {/* Header Ribbon — Single level container (NO nested box) */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-border-default/40 bg-elevated/20 select-none">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary font-mono">
              Committed Trade Plan
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-wider uppercase border ${
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
            {side}
          </span>
        </div>

        {/* Directional Setup & Conviction Row — Directly on surface (NO nested box) */}
        <div className="px-3.5 pt-3 pb-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
              Directional Setup
            </span>
            <span
              className={`text-lg font-black tracking-tight mt-0.5 ${
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
        <div className="mx-3.5 border-t border-border-default/40" />

        {/* Visual Price Ladder (Unboxed, NO nested box) */}
        <div className="px-3.5 py-2.5">
          <PriceLadderBar
            entry={entry}
            target={target}
            stopLoss={stopLoss}
            side={side}
            compact={false}
          />
        </div>

        {/* Divider */}
        <div className="mx-3.5 border-t border-border-default/40" />

        {/* Structured Analysis Cards (Flat accordions, NO nested box) */}
        <div className="px-3.5 py-1.5">
          <StructuredAnalysisCards
            setupValidation={finalTrade.setup_validation}
            executionPlan={finalTrade.execution_plan}
          />
        </div>
      </div>
    </div>
  );
}
