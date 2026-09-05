'use client';

import React from 'react';
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
      <div className="w-full rounded-lg border border-border-default bg-surface overflow-hidden shadow-sm">
        {/* Sleek Minimal Header Ribbon */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border-default/60 bg-elevated/20 select-none">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-widest uppercase border ${
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

        {/* Visual Core: Price Ladder */}
        <div className="p-3.5 space-y-3">
          <PriceLadderBar
            entry={entry}
            target={target}
            stopLoss={stopLoss}
            side={side}
            compact={false}
          />

          {/* Structured Analysis Cards (Collapsed by default) */}
          <StructuredAnalysisCards
            setupValidation={finalTrade.setup_validation}
            executionPlan={finalTrade.execution_plan}
          />
        </div>
      </div>
    </div>
  );
}
