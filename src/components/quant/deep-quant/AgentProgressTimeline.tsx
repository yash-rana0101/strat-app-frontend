'use client';

// components/quant/deep-quant/AgentProgressTimeline.tsx
//
// The horizontal run timeline across the top of the Agent View.
//
// Same `deriveProgress` the sidebar list uses, laid out sideways — so the two can never disagree
// about which step is running. Clicking a node selects it in the detail panel, which is the
// dialog's fast path to "why did it decide that".
//
// Horizontally scrollable rather than compressed: a long run can call a dozen tools, and squeezing
// twelve labels into 1100px leaves none of them readable.

import React from 'react';
import { Check, ChevronRight, Loader2 } from 'lucide-react';

import type { AiExecutionPlan, ReasoningStep } from '../../../store/useQuantStore';
import { deriveProgress } from './agentTimeline';

interface AgentProgressTimelineProps {
  reasoningSteps: ReasoningStep[];
  sessionStatus: string;
  finalTrade: AiExecutionPlan | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
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
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border-default/40 bg-elevated/10 px-3 py-2 scrollbar-thin"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <ChevronRight size={11} className="shrink-0 text-text-muted/50" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={selectedId === item.id ? 'step' : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded border px-2 py-1 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              selectedId === item.id
                ? 'border-primary/50 bg-primary/10 text-text-primary'
                : 'border-border-default/50 bg-surface text-text-secondary hover:border-border-default hover:text-text-primary'
            }`}
          >
            {item.status === 'done' ? (
              <Check size={10} className="shrink-0 text-emerald-500" aria-hidden="true" />
            ) : (
              <Loader2 size={10} className="shrink-0 animate-spin text-amber-500" aria-hidden="true" />
            )}
            <span className="whitespace-nowrap text-[10px] font-semibold">{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
