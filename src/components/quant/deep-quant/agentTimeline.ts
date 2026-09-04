// components/quant/deep-quant/agentTimeline.ts
//
// The PURE derivations behind the glass box. No React, no store, no I/O — every function here
// takes the reasoning steps the reducer already produced and returns something renderable.
//
// This module exists because the transcript is now presented at TWO levels: a condensed
// progress list in the sidebar, and the full timeline in the Agent View dialog. Both have to
// agree — if the sidebar says a tool is still running, the dialog cannot say it finished — and
// the only way to guarantee that is for both to call the same function over the same steps.
//
// `buildRenderGroups` and `isToolStepCompleted` are MOVED, not rewritten: they were inline in
// `AgentTerminal` and `ToolExecutionStep` respectively, and four property-test suites pin their
// behaviour. Both callers now import from here, so there is one copy to keep correct.

import type { AiExecutionPlan, ReasoningStep } from '../../../store/useQuantStore';

// ── The transcript grouping (moved verbatim from AgentTerminal) ───────────────

export type RenderGroup =
  | { type: 'thinking_group'; steps: ReasoningStep[]; id: string }
  | { type: 'decision'; step: ReasoningStep; id: string }
  | { type: 'tool_start'; step: ReasoningStep; id: string }
  | { type: 'legacy'; step: ReasoningStep; id: string };

/**
 * Is this message step a trailing decision-shaped JSON blob rather than prose?
 *
 * Kept free of JSX so a parse failure — an expected, non-exceptional case for free-form model
 * text — never risks building elements inside a try/catch.
 */
function isJsonDecisionMessage(content: string): boolean {
  const cleanContent = content.replace(/\{[\s\S]*\}/g, '').trim();
  if (cleanContent) return false;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return false;
    const parsed = JSON.parse(jsonMatch[0]);
    const conviction = parsed.conviction_score ?? parsed.conviction;
    const validation = parsed.setup_validation ?? parsed.validation ?? parsed.setup;
    const plan = parsed.execution_plan ?? parsed.plan;
    return conviction !== undefined || !!validation || !!plan;
  } catch {
    return false;
  }
}

/**
 * Collapse the flat step list into render groups.
 *
 * Consecutive prose messages become ONE `thinking_group` so a long stream does not produce a
 * component per chunk. `tool_end` is dropped: it is paired with its `tool_start` by
 * `isToolStepCompleted` rather than rendered as a row of its own.
 */
export function buildRenderGroups(reasoningSteps: ReasoningStep[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  let thinking: ReasoningStep[] = [];

  const flushThinking = () => {
    if (thinking.length === 0) return;
    groups.push({ type: 'thinking_group', steps: thinking, id: thinking[0].id });
    thinking = [];
  };

  for (const step of reasoningSteps) {
    if (step.type === 'message') {
      if (isJsonDecisionMessage(step.content)) {
        flushThinking();
        groups.push({ type: 'decision', step, id: step.id });
      } else {
        thinking.push(step);
      }
      continue;
    }

    flushThinking();
    if (step.type === 'tool_start') {
      groups.push({ type: 'tool_start', step, id: step.id });
    } else if (step.type === 'tool_end') {
      // Skip: pairing is done in isToolStepCompleted.
    } else {
      groups.push({ type: 'legacy', step, id: step.id });
    }
  }

  flushThinking();
  return groups;
}

/**
 * Has this `tool_start` been answered by a matching `tool_end`?
 *
 * Paired by SEQUENTIAL COUNT rather than by id, because the stream carries only the tool name:
 * the nth start of a tool is closed by the nth end of that tool. A settled run counts every
 * tool as finished — a stream that ended without its closing frame must not leave a spinner
 * turning forever.
 */
export function isToolStepCompleted(
  step: ReasoningStep,
  reasoningSteps: ReasoningStep[],
  sessionStatus: string,
): boolean {
  const stepIdx = reasoningSteps.indexOf(step);
  const startsUpToHere = reasoningSteps
    .slice(0, stepIdx + 1)
    .filter((s) => s.type === 'tool_start' && s.toolName === step.toolName).length;
  const endsAfterHere = reasoningSteps
    .slice(stepIdx + 1)
    .filter((s) => s.type === 'tool_end' && s.toolName === step.toolName).length;
  return endsAfterHere >= startsUpToHere || sessionStatus !== 'running';
}

// ── Progress, shared by the sidebar list and the dialog timeline ──────────────

export type ProgressStatus = 'done' | 'active';

export interface ProgressItem {
  /** The reasoning step's own id, so a click can select the same row in either surface. */
  id: string;
  kind: 'tool' | 'decision';
  /** Human label — the tool name with underscores removed, or the committed action. */
  label: string;
  /**
   * One short line of context, built ONLY from what the payload carried. Empty when the tool
   * was called with no arguments worth showing — never padded with a guess.
   */
  meta: string;
  status: ProgressStatus;
}

/**
 * Argument keys worth putting on a progress row, in display order.
 *
 * An allowlist rather than "render every arg": a tool's args can be arbitrarily wide (a candle
 * request carries limits, offsets and flags) and a progress row has space for a symbol and a
 * timeframe. The FULL argument list is still shown in the dialog's detail panel, which is where
 * someone asking "what exactly was this called with" is looking.
 */
const META_KEYS = ['symbol', 'underlying', 'timeframe', 'interval', 'expiry', 'direction', 'side', 'action'];

/** The short context line for a tool row. Returns '' when the args carry none of the keys. */
export function progressMeta(args: Record<string, unknown> | undefined): string {
  if (!args) return '';
  const parts: string[] = [];
  for (const key of META_KEYS) {
    const value = args[key];
    if (typeof value === 'string' && value.trim()) parts.push(value.trim());
    else if (typeof value === 'number' && Number.isFinite(value)) parts.push(String(value));
  }
  return parts.join(' · ');
}

/** `get_multi_tf_trend` → `Get Multi Tf Trend`. */
export function formatToolName(toolName: string | undefined): string {
  if (!toolName) return 'Tool';
  return toolName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * The condensed progress the sidebar and the dialog both render.
 *
 * DERIVED, never scripted. There is deliberately no list of expected stages and no `pending`
 * status: a row exists because a frame for it arrived. A fixed pipeline drawn ahead of the
 * stream would show steps the agent may never run — which is indistinguishable, on screen, from
 * steps that are about to run, and the whole point of the glass box is that it does not claim
 * things that did not happen.
 *
 * The trailing decision row is real for the same reason: it appears only once the reducer has
 * built a plan from a committed DECISION frame.
 */
export function deriveProgress(
  reasoningSteps: ReasoningStep[],
  sessionStatus: string,
  finalTrade: AiExecutionPlan | null,
): ProgressItem[] {
  const items: ProgressItem[] = reasoningSteps
    .filter((step) => step.type === 'tool_start')
    .map((step) => ({
      id: step.id,
      kind: 'tool' as const,
      label: formatToolName(step.toolName),
      meta: progressMeta(step.args),
      status: isToolStepCompleted(step, reasoningSteps, sessionStatus) ? ('done' as const) : ('active' as const),
    }));

  if (finalTrade) {
    const conviction =
      typeof finalTrade.conviction_score === 'number' ? `${finalTrade.conviction_score}%` : '';
    items.push({
      id: 'decision',
      kind: 'decision',
      label: 'Declare Trade',
      meta: [finalTrade.action ?? '', conviction].filter(Boolean).join(' · '),
      // A plan can exist while the run is still streaming (the DECISION frame lands before
      // RUN_FINISHED), so this settles with the run rather than with the plan's existence.
      status: sessionStatus === 'running' ? 'active' : 'done',
    });
  }

  return items;
}

/** The step a progress row points at, or null for the synthetic decision row. */
export function stepForProgressItem(
  item: ProgressItem,
  reasoningSteps: ReasoningStep[],
): ReasoningStep | null {
  if (item.kind !== 'tool') return null;
  return reasoningSteps.find((s) => s.id === item.id) ?? null;
}
