// components/quant/deep-quant/__tests__/agentTimeline.test.ts
//
// The check behind the split presentation.
//
// The sidebar's condensed progress and the Agent View's timeline are two renderings of ONE
// derivation, and the whole claim of the redesign is that they cannot disagree. That claim rests
// on `deriveProgress` being a pure function of the streamed steps — so this file pins the two
// properties that would break it silently:
//
//   1. NOTHING IS INVENTED. A row exists only because a `tool_start` frame arrived (plus the
//      decision row once a plan is committed). A regression that pre-drew an expected pipeline
//      would show steps the agent never ran, which on screen is indistinguishable from steps
//      about to run.
//   2. THE TWO SURFACES AGREE on which step is live, because `isToolStepCompleted` is the single
//      pairing rule. A second copy in either surface would drift.
//
// `buildRenderGroups` is covered here too — it moved out of `AgentTerminal` in this change, and
// the existing render suites exercise it only through the DOM.

import { describe, expect, it } from 'vitest';

import type { AiExecutionPlan, ReasoningStep } from '@/store/useQuantStore';
import {
  buildRenderGroups,
  deriveProgress,
  isToolStepCompleted,
  progressMeta,
} from '../agentTimeline';

let seq = 0;
function step(partial: Partial<ReasoningStep> & { type: string }): ReasoningStep {
  seq += 1;
  return {
    id: partial.id ?? `s${seq}`,
    type: partial.type,
    content: partial.content ?? '',
    timestamp: seq,
    toolName: partial.toolName,
    args: partial.args,
  };
}

const PLAN: AiExecutionPlan = {
  conviction_score: 65,
  setup_validation: 'Tier: b_continuation SELL; macro bias is Bearish.',
  execution_plan: 'Sell the retest.',
  action: 'SELL',
  execution_levels: { entry: 126.71, stop_loss: 130.2, take_profit: 117.5 },
};

describe('deriveProgress — rows come from the stream, never from a script', () => {
  it('yields nothing at all before any frame arrives', () => {
    // The empty state is the caller's job. A placeholder row here would render as a step that is
    // about to happen, which is a claim about the agent's plan that nobody made.
    expect(deriveProgress([], 'idle', null)).toEqual([]);
    expect(deriveProgress([], 'running', null)).toEqual([]);
  });

  it('yields one row per tool_start, in stream order', () => {
    const steps = [
      step({ type: 'tool_start', toolName: 'get_multi_tf_trend', args: { symbol: 'CANBK' } }),
      step({ type: 'message', content: 'thinking about it' }),
      step({ type: 'tool_start', toolName: 'get_consensus_report', args: { symbol: 'CANBK' } }),
    ];

    const items = deriveProgress(steps, 'running', null);
    expect(items.map((i) => i.label)).toEqual(['Get Multi Tf Trend', 'Get Consensus Report']);
    // Prose does not become a row: it is transcript content, and it is what used to flood the
    // sidebar.
    expect(items).toHaveLength(2);
  });

  it('marks a tool active until its own tool_end arrives', () => {
    const start = step({ type: 'tool_start', toolName: 'get_candles' });
    const running = deriveProgress([start], 'running', null);
    expect(running[0].status).toBe('active');

    const done = deriveProgress(
      [start, step({ type: 'tool_end', toolName: 'get_candles' })],
      'running',
      null,
    );
    expect(done[0].status).toBe('done');
  });

  it('settles every tool once the run is no longer running', () => {
    // A stream that ends without its closing frame must not leave a spinner turning forever —
    // the user would read a finished run as still working.
    const start = step({ type: 'tool_start', toolName: 'get_candles' });
    expect(deriveProgress([start], 'complete', null)[0].status).toBe('done');
    expect(deriveProgress([start], 'error', null)[0].status).toBe('done');
  });

  it('pairs the nth start of a tool with the nth end of that tool', () => {
    // The stream carries only the tool NAME, so repeated calls have to be counted rather than
    // matched by id. First call closed, second still open.
    const first = step({ type: 'tool_start', toolName: 'get_candles' });
    const end = step({ type: 'tool_end', toolName: 'get_candles' });
    const second = step({ type: 'tool_start', toolName: 'get_candles' });
    const steps = [first, end, second];

    expect(isToolStepCompleted(first, steps, 'running')).toBe(true);
    expect(isToolStepCompleted(second, steps, 'running')).toBe(false);

    const items = deriveProgress(steps, 'running', null);
    expect(items.map((i) => i.status)).toEqual(['done', 'active']);
  });

  it('adds the decision row only once a plan is committed, and settles it with the run', () => {
    const steps = [step({ type: 'tool_start', toolName: 'declare_trade' })];

    expect(deriveProgress(steps, 'running', null)).toHaveLength(1);

    // A DECISION frame lands BEFORE RUN_FINISHED, so a plan can exist mid-run: the row is active
    // until the run settles, not the moment the plan appears.
    const mid = deriveProgress(steps, 'running', PLAN);
    expect(mid.at(-1)).toMatchObject({ id: 'decision', label: 'Declare Trade', status: 'active' });

    const settled = deriveProgress(steps, 'complete', PLAN);
    expect(settled.at(-1)).toMatchObject({ status: 'done', meta: 'SELL · 65%' });
  });

  it('omits conviction from the decision row when the payload carried none', () => {
    // R1.7: no `?? 75` anywhere. An absent score shows as absent.
    const plan: AiExecutionPlan = { ...PLAN, conviction_score: undefined };
    expect(deriveProgress([], 'complete', plan).at(-1)?.meta).toBe('SELL');
  });
});

describe('progressMeta — one short line, only from what arrived', () => {
  it('is empty when the tool was called with nothing worth showing', () => {
    expect(progressMeta(undefined)).toBe('');
    expect(progressMeta({})).toBe('');
    expect(progressMeta({ limit: 300, force_refresh: true })).toBe('');
  });

  it('joins the allowlisted keys in display order', () => {
    expect(progressMeta({ timeframe: '10m', symbol: 'CANBK', direction: 'SELL' })).toBe(
      'CANBK · 10m · SELL',
    );
  });

  it('drops non-finite numbers rather than printing NaN', () => {
    expect(progressMeta({ symbol: 'CANBK', expiry: Number.NaN })).toBe('CANBK');
  });
});

describe('buildRenderGroups — the transcript grouping that moved out of AgentTerminal', () => {
  it('collapses consecutive prose into one thinking group and drops tool_end rows', () => {
    const groups = buildRenderGroups([
      step({ type: 'message', content: 'first' }),
      step({ type: 'message', content: 'second' }),
      step({ type: 'tool_start', toolName: 'get_candles' }),
      step({ type: 'tool_end', toolName: 'get_candles' }),
      step({ type: 'message', content: 'third' }),
    ]);

    expect(groups.map((g) => g.type)).toEqual(['thinking_group', 'tool_start', 'thinking_group']);
    // A tool call BREAKS the group, which is why the e2e has to expand more than one toggle.
    expect(groups[0].type === 'thinking_group' && groups[0].steps).toHaveLength(2);
  });

  it('splits a decision-shaped JSON message out of the prose group', () => {
    const groups = buildRenderGroups([
      step({ type: 'message', content: 'reasoning' }),
      step({ type: 'message', content: '{"conviction_score": 65, "setup_validation": "x"}' }),
    ]);
    expect(groups.map((g) => g.type)).toEqual(['thinking_group', 'decision']);
  });

  it('keeps JSON that is not decision-shaped as ordinary prose', () => {
    // Unparseable or unrelated JSON must not be promoted to a decision card — that card asserts
    // the run reached a conclusion.
    const groups = buildRenderGroups([step({ type: 'message', content: '{"unrelated": 1}' })]);
    expect(groups.map((g) => g.type)).toEqual(['thinking_group']);
  });
});
