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
  const [openSection, setOpenSection] = useState<'catalysts' | 'risks' | 'plan' | null>(null);

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

  const toggleSection = (sec: 'catalysts' | 'risks' | 'plan') => {
    setOpenSection((prev) => (prev === sec ? null : sec));
  };

  const hasAnyData = catalysts.length > 0 || risks.length > 0 || planPoints.length > 0;
  if (!hasAnyData && !setupValidation && !executionPlan) return null;

  return (
    <div className={`space-y-1.5 font-sans ${className}`}>
      {/* 1. Key Catalysts Section */}
      {catalysts.length > 0 && (
        <div className="rounded-md border border-border-default/60 bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('catalysts')}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-elevated/30 transition-colors select-none focus:outline-none"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary truncate">
                Catalysts
              </span>
              <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {catalysts.length}
              </span>
              {openSection !== 'catalysts' && catalysts[0] && (
                <span className="text-[9.5px] text-text-muted truncate hidden sm:inline">
                  — {catalysts[0]}
                </span>
              )}
            </div>
            <div className="text-text-muted shrink-0">
              {openSection === 'catalysts' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </div>
          </button>

          {openSection === 'catalysts' && (
            <div className="px-3 pb-3 pt-1 border-t border-border-default/40 space-y-1.5 animate-fade-in">
              {catalysts.map((pt, i) => (
                <div key={`cat-${i}`} className="flex items-start gap-2 text-[10px] text-text-secondary leading-relaxed">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                  <span>{highlightNumbers(pt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Risks & Invalidation Section */}
      {risks.length > 0 && (
        <div className="rounded-md border border-border-default/60 bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('risks')}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-elevated/30 transition-colors select-none focus:outline-none"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <AlertTriangle size={12} className="text-amber-500 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary truncate">
                Risk & Invalidation
              </span>
              <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {risks.length}
              </span>
              {openSection !== 'risks' && risks[0] && (
                <span className="text-[9.5px] text-text-muted truncate hidden sm:inline">
                  — {risks[0]}
                </span>
              )}
            </div>
            <div className="text-text-muted shrink-0">
              {openSection === 'risks' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </div>
          </button>

          {openSection === 'risks' && (
            <div className="px-3 pb-3 pt-1 border-t border-border-default/40 space-y-1.5 animate-fade-in">
              {risks.map((pt, i) => (
                <div key={`risk-${i}`} className="flex items-start gap-2 text-[10px] text-text-secondary leading-relaxed">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  <span>{highlightNumbers(pt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Execution Milestones Section */}
      {planPoints.length > 0 && (
        <div className="rounded-md border border-border-default/60 bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('plan')}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-elevated/30 transition-colors select-none focus:outline-none"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Compass size={12} className="text-text-muted shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary truncate">
                Execution Steps
              </span>
              <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-elevated text-text-muted border border-border-default/60">
                {planPoints.length}
              </span>
            </div>
            <div className="text-text-muted shrink-0">
              {openSection === 'plan' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </div>
          </button>

          {openSection === 'plan' && (
            <div className="px-3 pb-3 pt-1 border-t border-border-default/40 space-y-1.5 animate-fade-in">
              {planPoints.map((pt, i) => (
                <div
                  key={`plan-${i}`}
                  className="flex items-start gap-2 rounded bg-elevated/30 p-1.5 text-[10px] leading-relaxed text-text-secondary"
                >
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[7.5px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{highlightNumbers(pt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Complete Raw Model Output Disclosure */}
      {(setupValidation || executionPlan) && (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setShowFullProse(!showFullProse)}
            className="flex w-full items-center justify-between rounded border border-border-default/40 bg-elevated/20 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary hover:bg-elevated/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <FileText size={10} />
              {showFullProse ? 'Hide Verbatim Output' : 'Full Output'}
            </span>
            {showFullProse ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {showFullProse && (
            <div className="mt-1.5 space-y-2 rounded border border-border-default/50 bg-surface/90 p-2.5 text-[10px] leading-relaxed text-text-secondary animate-fade-in select-text">
              {setupValidation && (
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted">
                    Setup Validation
                  </span>
                  <p className="mt-1 whitespace-pre-line">{highlightNumbers(setupValidation)}</p>
                </div>
              )}
              {executionPlan && (
                <div className="mt-2 pt-2 border-t border-border-default/40">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted">
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
