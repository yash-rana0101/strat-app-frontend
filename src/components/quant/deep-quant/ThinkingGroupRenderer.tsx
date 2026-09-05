import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  if (steps.length === 0) return null;

  return (
    <div className="w-full animate-fade-in font-sans my-1">
      {/* Dropdown toggle labeled simply as "Thinking" — simple, unboxed like Antigravity */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Thinking"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-muted hover:text-text-primary transition-colors duration-150 select-none focus:outline-none cursor-pointer group py-0.5"
      >
        {isExpanded ? (
          <ChevronDown
            size={12}
            className="shrink-0 text-text-muted group-hover:text-text-primary transition-transform"
            aria-hidden="true"
          />
        ) : (
          <ChevronRight
            size={12}
            className="shrink-0 text-text-muted group-hover:text-text-primary transition-transform"
            aria-hidden="true"
          />
        )}

        <span className="tracking-wide">{isRunning ? 'Thinking…' : 'Thinking'}</span>

        {isRunning && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
        )}
      </button>

      {/* Unboxed thinking trace — simple, elegant left accent line like Antigravity */}
      {isExpanded && (
        <div className="mt-1.5 mb-2 pl-3 border-l-2 border-border-default/40 text-text-secondary text-[11px] leading-relaxed w-full max-h-72 overflow-y-auto scrollbar-thin space-y-2 select-text">
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
