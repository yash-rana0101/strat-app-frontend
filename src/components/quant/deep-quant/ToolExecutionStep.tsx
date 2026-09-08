import React from 'react';
import {
  CheckCircle2,
  Loader2,
  Terminal,
  Activity,
  BarChart3,
  TrendingUp,
  Shapes,
  ChevronsUpDown,
  Newspaper,
  Brain,
  Compass,
  Scale,
  Workflow,
  Layers,
  Wrench,
  AlertTriangle,
  SlidersHorizontal,
  LineChart,
  Gauge,
  PlusCircle,
} from 'lucide-react';
import { ReasoningStep } from '../../../store/useQuantStore';
import { isToolStepCompleted, formatToolName } from './agentTimeline';

interface ToolExecutionStepProps {
  step: ReasoningStep;
  reasoningSteps: ReasoningStep[];
  sessionStatus: string;
  /** Given by the Agent View, which opens the step in its detail panel. Omitted in the sidebar. */
  onSelect?: (step: ReasoningStep) => void;
  isSelected?: boolean;
}

function getToolIcon(toolName: string | undefined, isCompleted: boolean) {
  const name = (toolName || '').toLowerCase().replace(/_/g, ' ');
  const colorClass = isCompleted ? 'text-text-muted group-hover:text-text-secondary' : 'text-emerald-400';
  
  if (name.includes('session') || name.includes('context')) return <Terminal size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('candles')) return <Activity size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('consensus')) return <BarChart3 size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('multi tf') || name.includes('trend')) return <TrendingUp size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('patterns')) return <Shapes size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('support') || name.includes('resistance')) return <ChevronsUpDown size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('news')) return <Newspaper size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('prediction')) return <Brain size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('regime')) return <Compass size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('strength')) return <Scale size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('flow') || name.includes('order')) return <Workflow size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('options') || name.includes('analytics')) return <Layers size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('event') || name.includes('risk')) return <AlertTriangle size={12} className="text-amber-400 shrink-0" />;
  if (name.includes('volume') || name.includes('profile')) return <SlidersHorizontal size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('forecast')) return <LineChart size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('performance') || name.includes('track record')) return <Gauge size={12} className={`${colorClass} shrink-0`} />;
  if (name.includes('declare') || name.includes('trade')) return <PlusCircle size={12} className={`${colorClass} shrink-0`} />;
  return <Wrench size={12} className={`${colorClass} shrink-0`} />;
}

export default function ToolExecutionStep({
  step,
  reasoningSteps,
  sessionStatus,
  onSelect,
  isSelected = false,
}: ToolExecutionStepProps) {
  if (step.type !== 'tool_start') return null;

  const isCompleted = isToolStepCompleted(step, reasoningSteps, sessionStatus);
  const formattedToolName = formatToolName(step.toolName);

  const interactive = !!onSelect;

  return (
    <div className="flex justify-start animate-fade-in font-sans w-full my-1 select-text">
      <div
        {...(interactive
          ? {
              role: 'button' as const,
              tabIndex: 0,
              'aria-pressed': isSelected,
              onClick: () => onSelect?.(step),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.(step);
                }
              },
            }
          : {})}
        className={`group flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-md text-[10px] w-full transition-all duration-200 ${
          isCompleted
            ? 'bg-elevated/20 border border-border-default/40 opacity-70 hover:opacity-100 hover:bg-elevated/40'
            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
        } ${
          interactive
            ? 'cursor-pointer hover:border-emerald-500/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500'
            : ''
        } ${isSelected ? 'ring-1 ring-emerald-500 bg-emerald-500/15 opacity-100' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {getToolIcon(step.toolName, isCompleted)}
          <span
            className={`font-semibold capitalize truncate ${
              isCompleted ? 'text-text-secondary group-hover:text-text-primary' : 'text-emerald-300 font-bold'
            }`}
          >
            {formattedToolName}
          </span>
        </div>

        <div className="shrink-0 flex items-center">
          {isCompleted ? (
            <CheckCircle2 size={12} className="text-emerald-500/80" />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <Loader2 size={12} className="animate-spin text-emerald-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
