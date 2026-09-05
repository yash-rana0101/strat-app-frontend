'use client';

// components/quant/deep-quant/QuantCompactProgress.tsx
//
// The sidebar's condensed run progress: one row per tool the agent actually called, plus the
// committed decision when there is one.

import React, { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  BarChart3,
  TrendingUp,
  Shapes,
  ChevronsUpDown,
  Brain,
  Layers,
  Wrench,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import type { AiExecutionPlan, ReasoningStep } from '../../../store/useQuantStore';
import { deriveProgress } from './agentTimeline';

interface QuantCompactProgressProps {
  reasoningSteps: ReasoningStep[];
  sessionStatus: string;
  finalTrade: AiExecutionPlan | null;
  /** Opens the Agent View at this row. */
  onSelect: (stepId: string) => void;
}

function getProgressIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('consensus')) return <BarChart3 size={11} className="text-cyan-400 shrink-0" />;
  if (l.includes('trend') || l.includes('candle'))
    return <TrendingUp size={11} className="text-emerald-400 shrink-0" />;
  if (l.includes('pattern')) return <Shapes size={11} className="text-violet-400 shrink-0" />;
  if (l.includes('support') || l.includes('resistance') || l.includes('level'))
    return <ChevronsUpDown size={11} className="text-amber-400 shrink-0" />;
  if (l.includes('predict') || l.includes('regime'))
    return <Brain size={11} className="text-indigo-400 shrink-0" />;
  if (l.includes('option') || l.includes('fno'))
    return <Layers size={11} className="text-blue-400 shrink-0" />;
  if (l.includes('decision') || l.includes('trade'))
    return <Target size={11} className="text-emerald-400 shrink-0" />;
  return <Wrench size={11} className="text-text-muted shrink-0" />;
}

export default function QuantCompactProgress({
  reasoningSteps,
  sessionStatus,
  finalTrade,
  onSelect,
}: QuantCompactProgressProps) {
  const items = deriveProgress(reasoningSteps, sessionStatus, finalTrade);
  const isComplete = sessionStatus === 'complete';
  // Keep collapsed by default when complete so the trade plan is immediately visible without scrolling
  const [isExpanded, setIsExpanded] = useState(!isComplete);

  if (items.length === 0) return null;

  // When complete, allow collapsing the 15 tools into a compact 1-row disclosure
  if (isComplete) {
    return (
      <div className="px-2 py-1 font-sans">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg border border-border-default/40 bg-surface/80 hover:bg-elevated text-left transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-text-primary">
              Analysis Pipeline Telemetry
            </span>
            <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-text-muted border border-border-default/40">
              {items.length} tools
            </span>
          </div>
          <div className="text-text-muted">
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        </button>

        {isExpanded && (
          <ul className="flex flex-col gap-1 mt-1.5">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  title={`Open ${item.label} in the full analysis`}
                  className="group flex w-full items-center justify-between gap-2 rounded-lg border border-border-default/40 bg-surface/60 px-2.5 py-1.5 text-left transition-all duration-150 hover:bg-elevated hover:border-border-default/80 opacity-85 hover:opacity-100 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-elevated/70 border border-border-default/50">
                      {getProgressIcon(item.label)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[10.5px] font-bold text-text-primary">
                        {item.label}
                      </span>
                      {item.meta && (
                        <span className="block truncate text-[8.5px] font-mono text-text-muted">
                          {item.meta}
                        </span>
                      )}
                    </div>
                  </div>
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Live running state (always expanded so user can watch progress)
  return (
    <ul className="flex flex-col gap-1 px-2 py-1.5 font-sans">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            title={`Open ${item.label} in the full analysis`}
            className={`group flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer ${
              item.status === 'active'
                ? 'border-emerald-500/35 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.08)]'
                : 'border-border-default/40 bg-surface/60 hover:bg-elevated hover:border-border-default/80 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-elevated/70 border border-border-default/50">
                {getProgressIcon(item.label)}
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[10.5px] font-bold ${
                    item.status === 'done' ? 'text-text-primary' : 'text-emerald-400'
                  }`}
                >
                  {item.label}
                </span>
                {item.meta && (
                  <span className="block truncate text-[8.5px] font-mono text-text-muted">
                    {item.meta}
                  </span>
                )}
              </div>
            </div>

            <span className="shrink-0">
              {item.status === 'done' ? (
                <CheckCircle2 size={12} className="text-emerald-400" aria-hidden="true" />
              ) : (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <Loader2 size={12} className="animate-spin text-emerald-400" aria-hidden="true" />
                </div>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
