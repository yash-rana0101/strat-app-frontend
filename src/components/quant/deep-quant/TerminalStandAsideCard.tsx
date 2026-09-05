'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import ConvictionGauge from '../visuals/ConvictionGauge';
import { highlightNumbers } from './textHighlighter';
import type { AiExecutionPlan } from '../../../store/useQuantStore';

interface TerminalStandAsideCardProps {
  finalTrade: AiExecutionPlan;
}

export default function TerminalStandAsideCard({ finalTrade }: TerminalStandAsideCardProps) {
  return (
    <div className="flex justify-start animate-fade-in font-sans w-full my-3 select-text">
      <div className="w-full rounded-lg border border-border-default bg-surface p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-border-default/60 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-elevated text-amber-500">
              <ShieldAlert size={13} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Stand Aside — Risk Guard Active
              </span>
              <span className="block text-[9px] text-text-muted">
                No directional edge identified under current risk parameters
              </span>
            </div>
          </div>

          <span className="rounded px-2 py-0.5 text-[8.5px] font-mono font-semibold uppercase tracking-wider bg-elevated text-text-muted border border-border-default">
            {finalTrade.action ? String(finalTrade.action).toUpperCase() : 'NO TRADE'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 bg-elevated/30 rounded-md p-2.5 border border-border-default/60">
          <div className="flex flex-col">
            <span className="text-[8.5px] font-semibold uppercase tracking-wider text-text-muted">
              Decision Bias
            </span>
            <span className="text-sm font-bold text-text-primary mt-0.5">
              Capital Preservation Prioritized
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

        {finalTrade.setup_validation && (
          <div className="rounded-md border border-border-default/60 bg-elevated/20 p-2.5 text-[10.5px] leading-relaxed text-text-secondary">
            <p className="italic border-l-2 border-border-default pl-2">
              &ldquo;{highlightNumbers(finalTrade.setup_validation)}&rdquo;
            </p>
          </div>
        )}

        {finalTrade.execution_plan && (
          <p className="text-[10px] text-text-muted leading-relaxed pt-1">
            {highlightNumbers(finalTrade.execution_plan)}
          </p>
        )}
      </div>
    </div>
  );
}
