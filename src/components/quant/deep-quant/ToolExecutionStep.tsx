import React from 'react';
import { ReasoningStep } from '../../../store/useQuantStore';
import { isToolStepCompleted } from './agentTimeline';
import ToolCallStatusRow from './ToolCallStatusRow';

interface ToolExecutionStepProps {
  step: ReasoningStep;
  reasoningSteps: ReasoningStep[];
  sessionStatus: string;
  /** Given by the Agent View, which opens the step in its detail panel. Omitted in the sidebar. */
  onSelect?: (step: ReasoningStep) => void;
  isSelected?: boolean;
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

  return (
    <ToolCallStatusRow
      toolName={step.toolName}
      status={isCompleted ? 'success' : 'running'}
      onSelect={onSelect ? () => onSelect(step) : undefined}
      isSelected={isSelected}
    />
  );
}
