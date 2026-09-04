'use client';

// components/quant/deep-quant/QuantCompactProgress.tsx
//
// The sidebar's condensed run progress: one row per tool the agent actually called, plus the
// committed decision when there is one.
//
// This is the answer to the problem the redesign exists for. The full transcript put a paragraph
// of `setup_validation` and every tool argument into a 380px column, so the trade got buried. Here
// a row is a name, at most one line of context, and a state glyph — and the FULL text is one click
// away in the Agent View.
//
// The rows are DERIVED from the stream (`deriveProgress`), never scripted. There is no greyed-out
// list of stages waiting to happen: the agent's tool choice varies per run, so a fixed pipeline
// would draw steps that may never be called.

import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

import type { AiExecutionPlan, ReasoningStep } from '../../../store/useQuantStore';
import { deriveProgress } from './agentTimeline';

interface QuantCompactProgressProps {
  reasoningSteps: ReasoningStep[];
  sessionStatus: string;
  finalTrade: AiExecutionPlan | null;
  /** Opens the Agent View at this row. */
  onSelect: (stepId: string) => void;
}

export default function QuantCompactProgress({
  reasoningSteps,
  sessionStatus,
  finalTrade,
  onSelect,
}: QuantCompactProgressProps) {
  const items = deriveProgress(reasoningSteps, sessionStatus, finalTrade);

  if (items.length === 0) return null;

  return (
    <ul className="flex flex-col gap-px px-2 py-1.5">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            title={`Open ${item.label} in the full analysis`}
            className="group flex w-full items-start gap-2 rounded px-1.5 py-1.5 text-left transition-colors hover:bg-elevated/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <span className="mt-px shrink-0">
              {item.status === 'done' ? (
                <CheckCircle2 size={12} className="text-emerald-500" aria-hidden="true" />
              ) : (
                <Loader2 size={12} className="animate-spin text-amber-500" aria-hidden="true" />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-[10.5px] font-semibold ${
                  item.status === 'done' ? 'text-text-primary' : 'text-amber-500'
                }`}
              >
                {item.label}
              </span>
              {/* Rendered only when the payload carried something. An empty line reserved for
                  "metadata" is worse than none in a column this narrow. */}
              {item.meta && (
                <span className="block truncate text-[9px] text-text-muted">{item.meta}</span>
              )}
              {item.status === 'active' && (
                <span className="block text-[9px] text-amber-500/80">Analysing…</span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
