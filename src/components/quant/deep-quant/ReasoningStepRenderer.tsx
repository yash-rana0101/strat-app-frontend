import React from 'react';
import { Target } from 'lucide-react';
import { ReasoningStep } from '../../../store/useQuantStore';
import ConvictionGauge from '../visuals/ConvictionGauge';
import StructuredAnalysisCards from '../visuals/StructuredAnalysisCards';

interface ReasoningStepRendererProps {
  step: ReasoningStep;
}

function parseDecision(
  content: string
): { conviction?: unknown; validation?: unknown; plan?: unknown } | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    const conviction = parsed.conviction_score ?? parsed.conviction;
    const validation = parsed.setup_validation ?? parsed.validation ?? parsed.setup;
    const plan = parsed.execution_plan ?? parsed.plan;
    if (conviction === undefined && !validation && !plan) return null;
    return { conviction, validation, plan };
  } catch {
    return null;
  }
}

export default function ReasoningStepRenderer({ step }: ReasoningStepRendererProps) {
  if (step.type !== 'message') return null;

  const decision = parseDecision(step.content);
  if (!decision) return null;

  const { conviction, validation, plan } = decision;
  const numConviction = typeof conviction === 'number' ? conviction : undefined;

  return (
    <div className="flex justify-start animate-fade-in font-sans w-full select-text my-3">
      <div className="bg-surface text-text-primary border border-border-default rounded-lg p-3.5 w-full space-y-3">
        <div className="flex items-center justify-between border-b border-border-default/60 pb-2 select-none">
          <div className="flex items-center gap-1.5 text-[10px] text-text-primary font-bold uppercase tracking-wider">
            <Target size={12} className="text-primary shrink-0" />
            <span>Final Trade Decision</span>
          </div>

          <ConvictionGauge score={numConviction} size="sm" showLabel={true} />
        </div>

        <StructuredAnalysisCards
          setupValidation={validation ? String(validation) : undefined}
          executionPlan={plan ? String(plan) : undefined}
        />
      </div>
    </div>
  );
}
