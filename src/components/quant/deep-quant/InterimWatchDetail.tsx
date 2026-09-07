'use client';

// components/quant/deep-quant/InterimWatchDetail.tsx
//
// The visual trade intelligence dashboard rendered during active watch states
// and after background heartbeat checks, displaying directional bias,
// reference levels, market confluence matrix, and strategic thesis.

import React from 'react';
import { Activity, Eye, ShieldAlert } from 'lucide-react';

import {
  type BestCurrentRead,
  useQuantStore,
} from '../../../store/useQuantStore';
import { useFqHeartbeatInfo } from '../useFqHeartbeat';
import { formatTimeAgo } from './watchConditionHelper';
import ConfluenceMatrix from '../visuals/ConfluenceMatrix';
import PriceLadderBar from '../visuals/PriceLadderBar';
import StructuredAnalysisCards from '../visuals/StructuredAnalysisCards';

interface InterimWatchDetailProps {
  symbol: string;
  bestCurrentRead: BestCurrentRead | null;
  sessionStatus?: string;
}

export default function InterimWatchDetail({
  symbol,
  bestCurrentRead,
  sessionStatus,
}: InterimWatchDetailProps) {
  const consensusData = useQuantStore((s) => s.consensusData);
  const { heartbeatCount, lastHeartbeatAt, lastHeartbeatStatus } = useFqHeartbeatInfo();

  const rawBias = (bestCurrentRead?.bias || 'neutral').toLowerCase();
  const isBullish = rawBias.includes('bull') || rawBias === 'buy';
  const isBearish = rawBias.includes('bear') || rawBias === 'sell';
  const biasLabel = isBullish ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';

  const levels = bestCurrentRead?.levels || {};
  const levelEntries = Object.entries(levels).filter(
    ([, val]) => typeof val === 'number' && Number.isFinite(val)
  );

  // Check if we have complete execution levels for ladder display
  const entryLevel = levels.entry ?? levels.trigger ?? null;
  const targetLevel = levels.target ?? levels.take_profit ?? null;
  const slLevel = levels.invalidation ?? levels.stop_loss ?? levels.support ?? null;
  const canShowLadder =
    entryLevel != null &&
    targetLevel != null &&
    slLevel != null &&
    entryLevel > 0 &&
    targetLevel > 0 &&
    slLevel > 0;

  const biasTone = isBullish
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : isBearish
      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      : 'bg-amber-500/15 text-amber-400 border-amber-500/30';

  const setupValidation =
    bestCurrentRead?.why_standing_aside ||
    'Deep Quant watcher is actively monitoring order flow and price action against trigger conditions.';
  const executionPlan =
    'Active price watcher engaged. Upon trigger boundary match, the model synthesizes and executes order setup.';

  return (
    <div className="space-y-3 font-sans select-text">
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-border-default/40 pb-2 select-none">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-amber-400 shrink-0" />
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-text-primary font-mono">
            Active Watch Intelligence
          </h3>
        </div>
        <span className={`rounded px-2 py-0.5 text-[8.5px] font-mono font-bold uppercase tracking-widest border ${biasTone}`}>
          {biasLabel} BIAS
        </span>
      </div>

      {/* Directional Read & Heartbeat Telemetry */}
      <div className="flex items-center justify-between py-1">
        <div className="flex flex-col">
          <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
            Strategic Directional Read
          </span>
          <span className="text-base font-extrabold text-text-primary mt-0.5">
            {symbol ? `${symbol} • ` : ''}{biasLabel} SETUP
          </span>
        </div>

        {/* Heartbeat Badge */}
        <div className="flex flex-col items-end text-right">
          <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
            Heartbeat Monitor
          </span>
          <span className="text-[10.5px] font-mono font-semibold text-text-secondary mt-0.5">
            {heartbeatCount > 0
              ? `Pulse #${heartbeatCount}${lastHeartbeatAt ? ` (${formatTimeAgo(lastHeartbeatAt)})` : ''}`
              : 'Active Pulse'}
          </span>
        </div>
      </div>

      {/* Key Structural Levels Grid */}
      {levelEntries.length > 0 && (
        <div className="pt-1 border-t border-border-default/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8.5px] font-bold font-mono uppercase tracking-wider text-text-muted">
              Reference Structural Levels
            </span>
            <span className="text-[8.5px] font-mono text-text-muted">
              {levelEntries.length} levels mapped
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {levelEntries.map(([name, price]) => (
              <div
                key={name}
                className="flex items-center justify-between px-2 py-1 rounded bg-elevated/40 border border-border-default/40 text-[9.5px] font-mono"
              >
                <span className="capitalize text-text-muted">{name.replace(/_/g, ' ')}</span>
                <span className="font-bold text-text-primary">₹{price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Ladder (if levels are fully defined) */}
      {canShowLadder && (
        <div className="pt-1 border-t border-border-default/30">
          <PriceLadderBar
            entry={entryLevel}
            target={targetLevel}
            stopLoss={slLevel}
            side={isBearish ? 'SELL' : 'BUY'}
            compact={false}
          />
        </div>
      )}

      {/* Market Confluence Matrix */}
      {consensusData && (
        <div className="pt-1 border-t border-border-default/30">
          <ConfluenceMatrix consensus={consensusData} />
        </div>
      )}

      {/* Structured Analysis Cards */}
      <div className="pt-1 border-t border-border-default/30">
        <StructuredAnalysisCards
          setupValidation={setupValidation}
          executionPlan={executionPlan}
        />
      </div>
    </div>
  );
}

