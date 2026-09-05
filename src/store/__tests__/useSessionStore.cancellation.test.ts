// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL ||= 'http://127.0.0.1:0/api/v1';
  process.env.NEXT_PUBLIC_DASHBOARD_URL ||= 'http://127.0.0.1:0/dashboard';
  process.env.NEXT_PUBLIC_AUTH_URL ||= 'https://auth.test.invalid';
});

const { invokeSpy } = vi.hoisted(() => ({
  invokeSpy: vi.fn(async () => ({})),
}));

vi.mock('@/lib/bridge', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/bridge')>()),
  bridgeInvoke: invokeSpy,
}));

import { useSessionStore } from '../useSessionStore';
import { useQuantStore } from '../useQuantStore';
import { selectIsAnalyzing, selectSessionStatus } from '../sessionSelectors';

const SESS_1 = 'sess_11111111111111111111111111';
const THREAD_1 = 'thread_11111111111111111111111111';
const RUN_1 = 'run_11111111111111111111111111';

function frame(event: string, threadId: string, data: Record<string, unknown> = {}) {
  return { event, data: { thread_id: threadId, session_id: SESS_1, ...data } };
}

describe('Instant Stop Analysis Pipeline', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
    invokeSpy.mockClear();
  });

  it('cancelRun immediately sets isAnalyzing: false and sessionStatus: idle', () => {
    const store = useSessionStore.getState();
    store.setActiveSession(SESS_1);
    store.bindThread(THREAD_1, SESS_1, RUN_1);
    store.applyFrame(frame('RUN_STARTED', THREAD_1));

    expect(selectIsAnalyzing(useSessionStore.getState())).toBe(true);
    expect(selectSessionStatus(useSessionStore.getState())).toBe('running');

    // User hits "Stop analysis"
    useSessionStore.getState().cancelRun(SESS_1);

    const after = useSessionStore.getState();
    expect(selectIsAnalyzing(after)).toBe(false);
    expect(selectSessionStatus(after)).toBe('idle');

    const session = after.sessions[SESS_1];
    expect(session.isAnalyzing).toBe(false);
    expect(session.sessionStatus).toBe('idle');
    expect(session.reasoningSteps.some((s) => s.content.includes('cancelled by user'))).toBe(true);
  });

  it('drops subsequent stream frames after cancellation so analysis is not resurrected', () => {
    const store = useSessionStore.getState();
    store.setActiveSession(SESS_1);
    store.bindThread(THREAD_1, SESS_1, RUN_1);
    store.applyFrame(frame('RUN_STARTED', THREAD_1));
    store.applyFrame(frame('REASONING', THREAD_1, { content: 'Analyzing indicators...' }));

    // Stop analysis
    useSessionStore.getState().cancelRun(SESS_1);

    const stepCountBefore = useSessionStore.getState().sessions[SESS_1].reasoningSteps.length;

    // Late arriving frame from network buffer
    const result = useSessionStore.getState().applyFrame(
      frame('REASONING', THREAD_1, { content: 'Late chunk that must be dropped' })
    );

    expect(result).toBeNull();
    const after = useSessionStore.getState();
    expect(selectIsAnalyzing(after)).toBe(false);
    expect(selectSessionStatus(after)).toBe('idle');
    expect(after.sessions[SESS_1].reasoningSteps.length).toBe(stepCountBefore);
  });

  it('RUN_STARTED clears prior cancellation and allows new run to stream', () => {
    const store = useSessionStore.getState();
    store.setActiveSession(SESS_1);
    store.bindThread(THREAD_1, SESS_1, RUN_1);
    store.applyFrame(frame('RUN_STARTED', THREAD_1));

    // Cancel first run
    store.cancelRun(SESS_1);
    expect(selectIsAnalyzing(useSessionStore.getState())).toBe(false);

    // New run begins
    const NEW_THREAD = 'thread_22222222222222222222222222';
    store.bindThread(NEW_THREAD, SESS_1, 'run_2');
    store.applyFrame({ event: 'RUN_STARTED', data: { thread_id: NEW_THREAD, session_id: SESS_1 } });

    expect(selectIsAnalyzing(useSessionStore.getState())).toBe(true);
    expect(selectSessionStatus(useSessionStore.getState())).toBe('running');

    // Frames for new run stream through
    store.applyFrame({ event: 'REASONING', data: { thread_id: NEW_THREAD, content: 'Fresh analysis...' } });
    const steps = useSessionStore.getState().sessions[SESS_1].reasoningSteps;
    expect(steps.some((s) => s.content.includes('Fresh analysis...'))).toBe(true);
  });

  it('cancelAnalysis in useQuantStore stops both session and quant stores and notifies bridge', async () => {
    const sessionStore = useSessionStore.getState();
    sessionStore.setActiveSession(SESS_1);
    sessionStore.bindThread(THREAD_1, SESS_1, RUN_1);
    sessionStore.applyFrame(frame('RUN_STARTED', THREAD_1));

    expect(selectIsAnalyzing(useSessionStore.getState())).toBe(true);

    // Invoke cancelAnalysis
    await useQuantStore.getState().cancelAnalysis();

    // Verifies both stores are stopped
    expect(selectIsAnalyzing(useSessionStore.getState())).toBe(false);
    expect(useQuantStore.getState().isAnalyzing).toBe(false);

    // Verifies bridge was called with session_id, run_id, and thread_id
    expect(invokeSpy).toHaveBeenCalledWith('cancel_deep_quant_agent', {
      session_id: SESS_1,
      run_id: RUN_1,
      thread_id: THREAD_1,
    });
  });
});

