import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain, Check } from 'lucide-react';
import { ReasoningStep } from '../../../store/useQuantStore';
import MarkdownRenderer from './MarkdownRenderer';

interface ThinkingGroupRendererProps {
  steps: ReasoningStep[];
  sessionStatus: string;
}

export default function ThinkingGroupRenderer({
  steps,
  sessionStatus,
}: ThinkingGroupRendererProps) {
  const isRunning = sessionStatus === 'running';
  // Keep collapsed by default to keep the interface ultra-clean and easy to scan
  const [isExpanded, setIsExpanded] = useState(false);

  if (steps.length === 0) return null;

  return (
    <div className="w-full animate-fade-in font-sans">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-all duration-200 select-none focus:outline-none ${
          isRunning
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-sm'
            : 'bg-elevated/40 border-border-default/50 text-text-muted hover:text-text-primary hover:bg-elevated/70'
        }`}
      >
        <div className="flex items-center gap-2">
          {isRunning ? (
            <div className="relative flex items-center justify-center">
              <Brain size={12} className="text-emerald-400 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
          ) : (
            <div className="flex items-center justify-center text-emerald-500/80">
              <Check size={12} strokeWidth={2.5} />
            </div>
          )}

          <span className="text-[10px] font-semibold tracking-wide">
            {isRunning ? 'Analyzing market structure…' : 'Analysis Complete'}
          </span>

          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-text-muted border border-border-default/40">
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </span>
        </div>

        <div className="text-text-muted">
          {isExpanded ? (
            <ChevronDown size={12} aria-hidden="true" />
          ) : (
            <ChevronRight size={12} aria-hidden="true" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 text-text-secondary text-[10.5px] leading-relaxed w-full p-2.5 rounded-md bg-surface border border-border-default/60 max-h-60 overflow-y-auto scrollbar-thin space-y-2">
          {steps.map((step) => {
            const cleanContent = step.content.replace(/\{[\s\S]*\}/g, '').trim();
            if (!cleanContent) return null;
            return <MarkdownRenderer key={step.id} content={cleanContent} simple={true} />;
          })}
        </div>
      )}
    </div>
  );
}
