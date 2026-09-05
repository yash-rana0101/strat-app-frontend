'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import ConvictionGauge from '../visuals/ConvictionGauge';
import type { AiExecutionPlan } from '../../../store/useQuantStore';

interface TerminalStandAsideCardProps {
  finalTrade: AiExecutionPlan;
}

export default function TerminalStandAsideCard({ finalTrade }: TerminalStandAsideCardProps) {
  const actionLabel = finalTrade.action ? String(finalTrade.action).toUpperCase() : 'NO TRADE';

  return (
    <div className="flex justify-start animate-fade-in font-sans w-full my-2.5 select-text">
      <div className="w-full rounded-lg border border-amber-500/25 bg-amber-500/5 p-4 flex flex-col items-center text-center gap-3 relative overflow-hidden">
        {/* Subtle ambient amber glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        {/* Shield Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm">
          <ShieldAlert size={20} />
        </div>

        {/* Header & Subtitle */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[12px] font-bold uppercase tracking-wider text-amber-400 font-mono">
            Stand Aside — Risk Guard Active
          </span>
          <span className="text-[10px] text-text-muted">
            No directional edge under current market conditions
          </span>
        </div>

        {/* Conviction & Action Status Row */}
        <div className="flex items-center justify-center gap-4 pt-1 w-full border-t border-amber-500/15 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-text-muted font-mono">
              Action:
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-elevated text-amber-400 border border-amber-500/30">
              {actionLabel}
            </span>
          </div>

          <div className="h-4 w-px bg-border-default/60" />

          <ConvictionGauge
            score={finalTrade.conviction_score}
            action="HOLD"
            tier="stand_aside"
            size="sm"
            showLabel={true}
          />
        </div>
      </div>
    </div>
  );
}
