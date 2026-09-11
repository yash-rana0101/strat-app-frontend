// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL ||= 'http://127.0.0.1:0/api/v1';
  process.env.NEXT_PUBLIC_DASHBOARD_URL ||= 'http://127.0.0.1:0/dashboard';
  process.env.NEXT_PUBLIC_AUTH_URL ||= 'https://auth.test.invalid';
});

const { invokeSpy } = vi.hoisted(() => ({
  invokeSpy: vi.fn(),
}));

vi.mock('@/lib/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/env')>()),
  FQ_MULTI_SESSION: false,
}));

vi.mock('@/lib/bridge', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/bridge')>()),
  bridgeInvoke: invokeSpy,
  bridgeListen: vi.fn(async () => () => {}),
}));

import { useQuantStore } from '@/store/useQuantStore';
import { useTradeStore } from '@/store/useTradeStore';

const initialQuantState = useQuantStore.getState();
const initialTradeState = useTradeStore.getState();

function installSupportingSpies(order: string[] = []) {
  const fetchConsensusForSymbol = vi.fn(async () => {
    order.push('consensus');
  });
  const fetchMultiTfPatterns = vi.fn(async () => {
    order.push('patterns');
  });
  const refreshSentimentForSymbol = vi.fn(async () => {
    order.push('sentiment');
  });

  useQuantStore.setState({
    fetchConsensusForSymbol,
    fetchMultiTfPatterns,
    refreshSentimentForSymbol,
    _armStreamWatchdog: vi.fn(),
  });

  return { fetchConsensusForSymbol, fetchMultiTfPatterns, refreshSentimentForSymbol };
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SKU_ENFORCE', '');
  vi.stubEnv('NEXT_PUBLIC_PROD', '');
  invokeSpy.mockReset();
  useQuantStore.setState(initialQuantState, true);
  useTradeStore.setState({
    selectedSymbol: 'RELIANCE',
    activeTimeframe: '10m',
    activeProfile: 'INTRADAY',
    fnoExpiry: '',
  });
});

afterEach(() => {
  useQuantStore.setState(initialQuantState, true);
  useTradeStore.setState(initialTradeState, true);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('Find Trade supporting analysis credit boundary', () => {
  it('starts consensus, patterns, and sentiment only after the approved FIND run', async () => {
    const order: string[] = [];
    invokeSpy.mockImplementation(async (command: string) => {
      expect(command).toBe('run_deep_quant_agent');
      order.push('run-approved');
      return 'thread-1';
    });
    const support = installSupportingSpies(order);

    await useQuantStore.getState().fetchDeepAnalysis('RELIANCE', 'FIND');

    expect(order).toEqual(['run-approved', 'consensus', 'patterns', 'sentiment']);
    expect(support.fetchConsensusForSymbol).toHaveBeenCalledWith('RELIANCE', '10m');
    expect(support.fetchMultiTfPatterns).toHaveBeenCalledWith('RELIANCE');
    expect(support.refreshSentimentForSymbol).toHaveBeenCalledWith(
      'RELIANCE',
      useQuantStore.getState().selectedModel
    );
  });

  it('does not start the supporting bundle for VERIFY', async () => {
    invokeSpy.mockResolvedValue('thread-verify');
    const support = installSupportingSpies();

    await useQuantStore.getState().fetchDeepAnalysis('RELIANCE', 'VERIFY', {
      side: 'BUY',
      entry: 2500,
      stopLoss: 2450,
      takeProfit: 2600,
      userAnalysis: 'breakout',
    });

    expect(invokeSpy).toHaveBeenCalledTimes(1);
    expect(support.fetchConsensusForSymbol).not.toHaveBeenCalled();
    expect(support.fetchMultiTfPatterns).not.toHaveBeenCalled();
    expect(support.refreshSentimentForSymbol).not.toHaveBeenCalled();
  });

  it('starts no supporting work and no pattern spinner when preflight rejects', async () => {
    invokeSpy.mockRejectedValue(
      new Error('HTTP 402: You are out of Strat AI credits. Top up your balance on the dashboard.')
    );
    const support = installSupportingSpies();

    await useQuantStore.getState().fetchDeepAnalysis('RELIANCE', 'FIND');

    const state = useQuantStore.getState();
    expect(support.fetchConsensusForSymbol).not.toHaveBeenCalled();
    expect(support.fetchMultiTfPatterns).not.toHaveBeenCalled();
    expect(support.refreshSentimentForSymbol).not.toHaveBeenCalled();
    expect(state.isFetchingPatterns).toBe(false);
    expect(state.isStartingRun).toBe(false);
    expect(state.sessionStatus).toBe('error');
    expect(state.analysisError).toContain('HTTP 402');
  });

  it('changing models does not independently refresh sentiment', () => {
    const support = installSupportingSpies();

    useQuantStore.getState().setSelectedModel('provider/new-model');

    expect(useQuantStore.getState().selectedModel).toBe('provider/new-model');
    expect(support.refreshSentimentForSymbol).not.toHaveBeenCalled();
  });
});