// lib/bridge/__tests__/webAdapters.qaOnHub.test.ts
//
// A Q&A turn must not corrupt the analysis session it is asked about.
//
// `GET /stream/{thread_id}` is a per-THREAD fan-out hub, and Q&A is answered on the SAME
// thread as the analysis (that is how the answer stays grounded). The server tees `/qa`
// into that hub so a client parked on a price watch still receives its own answer ΓÇö but
// that also means the paused-run reattach relay sees Q&A frames, and it used to forward
// every one of them onto `deep-quant-stream`.
//
// `applyStreamEvent` has no notion of `turn`, so the Q&A `RUN_STARTED` took its `watching`
// branch, which deliberately clears `finalTrade`/`aiPlan` so a resumed analysis leg can
// re-declare. A Q&A turn never declares anything, so simply ASKING "did you already give
// me a trade?" wiped the committed decision off the panel ΓÇö while the agent, reading the
// intact server-side transcript, correctly replied that it had. That is the reported
// "the AI says it gave a trade but the result doesn't show".
//
// Two claims here:
//   1. a Q&A frame arriving on the hub leaves the committed decision intact, and
//   2. it does not end the reattach loop ΓÇö the analysis is PAUSED, not finished, and a
//      Q&A turn always reaches `RUN_FINISHED(completed)`.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bridgeInvoke, __resetBridgeBus } from '../index';
import { applyStreamEvent, type QuantSession } from '../../../store/useQuantStore';

const THREAD = 'thread_01ABCDEFGHJKMNPQRSTVWXYZ00';

function sseResponse(frames: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const f of frames) controller.enqueue(encoder.encode(f));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

function frame(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  __resetBridgeBus();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function settle(times = 8) {
  for (let i = 0; i < times; i += 1) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

describe('Q&A frames on the per-thread stream hub', () => {
  it('does not relay a Q&A frame onto the analysis channel', async () => {
    // /run pauses at a price watch, then the hub replays a Q&A turn (turn: 'qa') the
    // user asked while waiting ΓÇö exactly what the server tee publishes.
    let call = 0;
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('/api/tools/')) return new Response('{}', { status: 200 });
      if (u.includes('/api/deepquant/run')) {
        return sseResponse([
          frame('RUN_STARTED', { thread_id: THREAD, turn: 'run' }),
          frame('RUN_FINISHED', { thread_id: THREAD, status: 'paused', turn: 'run' }),
        ]);
      }
      // The reattached hub.
      call += 1;
      if (call > 1) return new Response('', { status: 500 });
      return sseResponse([
        frame('RUN_STARTED', { thread_id: THREAD, turn: 'qa' }),
        frame('REASONING', { thread_id: THREAD, turn: 'qa', content: 'Yes ΓÇö I gave you a BUY.' }),
        frame('RUN_FINISHED', { thread_id: THREAD, status: 'completed', turn: 'qa' }),
      ]);
    });

    const analysisFrames: string[] = [];
    const { bridgeListen } = await import('../events');
    await bridgeListen<{ event: string }>('deep-quant-stream', (e) => {
      analysisFrames.push(e.payload.event);
    });

    await bridgeInvoke('run_deep_quant_agent', { symbol: 'RELIANCE', mode: 'FIND' });
    await settle();

    // The analysis channel saw the run's own frames and NONE of the Q&A turn's.
    expect(analysisFrames).toEqual(['RUN_STARTED', 'RUN_FINISHED']);
  });

  it('a Q&A RUN_STARTED would erase the committed decision if it reached the reducer', () => {
    // Pins WHY the filter above matters, at the reducer that does the damage. This is the
    // exact state a user is in: a watch is armed and a trade has been declared.
    const watching = {
      sessionStatus: 'watching',
      reasoningSteps: [],
      finalTrade: { action: 'BUY', conviction_score: 72, setup_validation: '', execution_plan: '' },
      aiPlan: { action: 'BUY', conviction_score: 72, setup_validation: '', execution_plan: '' },
      bestCurrentRead: null,
      heartbeatCount: 1,
      lastHeartbeatAt: 1,
      lastHeartbeatStatus: null,
      isAnalyzing: false,
      analysisError: null,
      _pendingToolCalls: 0,
      _runFinishedProcessed: true,
    } as unknown as QuantSession;

    const after = applyStreamEvent(watching, {
      event: 'RUN_STARTED',
      data: { thread_id: THREAD, turn: 'qa' },
    });

    // The reducer cannot tell a Q&A wake from a watcher wake ΓÇö it clears the plan. Hence
    // the frame must never be handed to it.
    expect(after.finalTrade).toBeNull();
  });
});
