'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Compass,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { highlightNumbers } from '../deep-quant/textHighlighter';

export interface StructuredAnalysisCardsProps {
  setupValidation?: string;
  executionPlan?: string;
  className?: string;
}

// Splits freeform paragraph into coherent bullet points
function splitSentences(text: string): string[] {
  if (!text) return [];
  // Split on newlines, bullet points, or periods followed by space/newline
  return text
    .split(/\n+|•|\d+\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

export default function StructuredAnalysisCards({
  setupValidation = '',
  executionPlan = '',
  className = '',
}: StructuredAnalysisCardsProps) {
  const [showFullProse, setShowFullProse] = useState(false);

  const validationPoints = splitSentences(setupValidation);
  const planPoints = splitSentences(executionPlan);

  // Classify points into catalysts vs risks
  const catalysts: string[] = [];
  const risks: string[] = [];

  validationPoints.forEach((pt) => {
    const lower = pt.toLowerCase();
    if (
      lower.includes('risk') ||
      lower.includes('invalidation') ||
      lower.includes('stop') ||
      lower.includes('caution') ||
      lower.includes('warning') ||
      lower.includes('failure') ||
      lower.includes('downside') ||
      lower.includes('chop')
    ) {
      risks.push(pt);
    } else {
      catalysts.push(pt);
    }
  });

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* 1. Key Catalysts / Setup Validation Card */}
      {catalysts.length > 0 && (
        <div className="rounded-lg border border-border-default bg-surface p-3.5">
          <div className="flex items-center gap-2 border-b border-border-default/60 pb-2 mb-2.5">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">
              Validated Setup Catalysts
            </span>
          </div>
          <ul className="space-y-2">
            {catalysts.map((pt, i) => (
              <li
                key={`cat-${i}`}
                className="flex items-start gap-2 text-[10.5px] leading-relaxed text-text-secondary"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{highlightNumbers(pt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. Risks & Invalidation Card */}
      {risks.length > 0 && (
        <div className="rounded-lg border border-border-default bg-surface p-3.5">
          <div className="flex items-center gap-2 border-b border-border-default/60 pb-2 mb-2.5">
            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">
              Risk & Invalidation Criteria
            </span>
          </div>
          <ul className="space-y-2">
            {risks.map((pt, i) => (
              <li
                key={`risk-${i}`}
                className="flex items-start gap-2 text-[10.5px] leading-relaxed text-text-secondary"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{highlightNumbers(pt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Execution Milestones Card */}
      {planPoints.length > 0 && (
        <div className="rounded-lg border border-border-default bg-surface p-3.5">
          <div className="flex items-center gap-2 border-b border-border-default/60 pb-2 mb-2.5">
            <Compass size={13} className="text-text-muted shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">
              Execution Roadmap & Milestones
            </span>
          </div>
          <div className="space-y-2">
            {planPoints.map((pt, i) => (
              <div
                key={`plan-${i}`}
                className="flex items-start gap-2.5 rounded-md border border-border-default/60 bg-elevated/30 p-2 text-[10.5px] leading-relaxed text-text-secondary"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[8.5px] font-bold text-primary">
                  {i + 1}
                </span>
                <span>{highlightNumbers(pt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Complete Raw Model Output Disclosure */}
      {(setupValidation || executionPlan) && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFullProse(!showFullProse)}
            className="flex w-full items-center justify-between rounded-lg border border-border-default/50 bg-elevated/20 px-3 py-2 text-[9.5px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary hover:bg-elevated/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <FileText size={11} />
              {showFullProse ? 'Hide Verbatim Reasoning' : 'View Full Verbatim Text'}
            </span>
            {showFullProse ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showFullProse && (
            <div className="mt-2 space-y-2 rounded-lg border border-border-default/50 bg-surface/90 p-3 text-[10.5px] leading-relaxed text-text-secondary animate-fade-in select-text">
              {setupValidation && (
                <div>
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-text-muted">
                    Setup Validation
                  </span>
                  <p className="mt-1 whitespace-pre-line">{highlightNumbers(setupValidation)}</p>
                </div>
              )}
              {executionPlan && (
                <div className="mt-2 pt-2 border-t border-border-default/40">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-text-muted">
                    Execution Plan
                  </span>
                  <p className="mt-1 whitespace-pre-line">{highlightNumbers(executionPlan)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
