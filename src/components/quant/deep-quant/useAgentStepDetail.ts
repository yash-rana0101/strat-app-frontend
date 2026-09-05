import React from 'react';
import type { ReasoningStep } from '../../../store/useQuantStore';

export function useAgentStepDetail(
  initialSelectedId: string | null,
  reasoningSteps: ReasoningStep[]
) {
  const [selectedId, setSelectedId] = React.useState<string | null>(initialSelectedId);
  const [syncedInitial, setSyncedInitial] = React.useState(initialSelectedId);

  if (initialSelectedId !== syncedInitial) {
    setSyncedInitial(initialSelectedId);
    setSelectedId(initialSelectedId);
  }

  const selectedStep: ReasoningStep | null = React.useMemo(() => {
    if (!selectedId || selectedId === 'decision') return null;
    return reasoningSteps.find((s) => s.id === selectedId) ?? null;
  }, [selectedId, reasoningSteps]);

  const selectedResult: string | null = React.useMemo(() => {
    if (!selectedStep) return null;
    const startIdx = reasoningSteps.indexOf(selectedStep);
    if (startIdx < 0) return null;
    const end = reasoningSteps
      .slice(startIdx + 1)
      .find((s) => s.type === 'tool_end' && s.toolName === selectedStep.toolName);
    return end?.content ?? null;
  }, [selectedStep, reasoningSteps]);

  return {
    selectedId,
    setSelectedId,
    selectedStep,
    selectedResult,
  };
}
