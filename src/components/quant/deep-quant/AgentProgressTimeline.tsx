'use client';

// components/quant/deep-quant/AgentProgressTimeline.tsx
//
// The horizontal run timeline across the top of the Agent View.

import React from 'react';
import {
  Check,
  ChevronRight,
  Loader2,
  BarChart3,
  TrendingUp,
  Shapes,
  ChevronsUpDown,
  Brain,
  Layers,
  Wrench,
  Target,
} from 'lucide-react';

import type { AiExecutionPlan, ReasoningStep } from '../../../store/useQuantStore';
import { deriveProgress } from './agentTimeline';

interface AgentProgressTimelineProps {
  reasoningSteps: ReasoningStep[];
  sessionStatus: string;
  finalTrade: AiExecutionPlan | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function getTimelineIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('consensus')) return <BarChart3 size={10} className="shrink-0 text-cyan-400" />;
  if (l.includes('trend') || l.includes('candle'))
    return <TrendingUp size={10} className="shrink-0 text-emerald-400" />;
  if (l.includes('pattern')) return <Shapes size={10} className="shrink-0 text-violet-400" />;
  if (l.includes('support') || l.includes('resistance') || l.includes('level'))
    return <ChevronsUpDown size={10} className="shrink-0 text-amber-400" />;
  if (l.includes('predict') || l.includes('regime'))
    return <Brain size={10} className="shrink-0 text-indigo-400" />;
  if (l.includes('option') || l.includes('fno'))
    return <Layers size={10} className="shrink-0 text-blue-400" />;
  if (l.includes('decision') || l.includes('trade'))
    return <Target size={10} className="shrink-0 text-emerald-400" />;
  return <Wrench size={10} className="shrink-0 text-text-muted" />;
}

export default function AgentProgressTimeline({
  reasoningSteps,
  sessionStatus,
  finalTrade,
  selectedId,
  onSelect,
}: AgentProgressTimelineProps) {
  const items = deriveProgress(reasoningSteps, sessionStatus, finalTrade);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Agent progress"
      className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border-default/40 bg-elevated/15 px-3 py-2 scrollbar-thin select-none font-sans"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <ChevronRight size={10} className="shrink-0 text-text-muted/40" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={selectedId === item.id ? 'step' : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              selectedId === item.id
                ? 'border-primary/60 bg-primary/15 text-text-primary shadow-xs ring-1 ring-primary/40'
                : 'border-border-default/50 bg-surface/80 text-text-secondary hover:border-border-default/90 hover:text-text-primary hover:bg-elevated'
            }`}
          >
            {getTimelineIcon(item.label)}
            <span className="whitespace-nowrap">{item.label}</span>
            {item.status === 'done' ? (
              <Check size={10} className="shrink-0 text-emerald-400 ml-0.5" aria-hidden="true" />
            ) : (
              <Loader2
                size={10}
                className="shrink-0 animate-spin text-amber-400 ml-0.5"
                aria-hidden="true"
              />
            )}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
