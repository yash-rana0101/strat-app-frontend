/**
 * @vitest-environment jsdom
 */
// Feature: ghost-line-consistency
//
// A REJECTED projection must not blank the chart.
//
// `applyGhostBounds` discards a candidate whose first forward step (or, for the
// straight engines, whose end point) leaves the ±20% price band. That fires on
// a single volatile tick. The old signature returned `[]` for that case AND for
// "this symbol has no data", so the draw effect could not tell them apart and
// called `renderer.clear()` for both — the line visibly disappeared and came
// back a moment later. `computeGhostProjection` now reports `rejected` vs
// `empty`, and only `empty` clears.
//
// The counterpart risk is a line frozen forever on a stale projection, so a
// rejection streak eventually clears too.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGhostLine } from '../useGhostLine';
import { useTradeStore, type OhlcCandle } from '../../store/useTradeStore';
import { useChartUIStore } from '../../store/useChartUIStore';
import { useFeatureStore } from '../../store/useFeatureStore';
import { ALL_SWITCHES_OFF } from '../../lib/featureFlags';

const projection = vi.fn();
vi.mock('../ghostLineComputation', () => ({
  computeGhostProjection: (...args: unknown[]) => projection(...args),
  clampProjectionBars: (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 20),
}));

function makeWidget() {
  const onChart = new Set<string>();
  let n = 0;
  const chart = {
    getVisibleRange: () => ({ from: 0, to: 1000 }),
    onVisibleRangeChanged: () => ({ subscribe: () => {}, unsubscribeAll: () => {} }),
    timeScale: () => ({ rightOffset: () => 10 }),
    exportData: vi.fn(async () => ({ schema: [], data: [] })),
    createMultipointShape: vi.fn(async () => {
      const id = `id-${++n}`;
      onChart.add(id);
      return id;
    }),
    removeEntity: vi.fn((id: string) => {
      onChart.delete(id);
    }),
  };
  const widget = {
    onChartReady: (cb: () => void) => cb(),
    chartReady: async () => {},
    activeChart: () => chart,
  };
  return { widget, chart, onChart };
}

const settle = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

/** Drive one extra redraw by advancing the newest bar for the symbol. */
async function newBar(t: number) {
  await act(async () => {
    useTradeStore.setState({
      ohlcCandles: [
        { symbol: 'NIFTY', start_timestamp_ms: t, open: 1, high: 1, low: 1, close: 1, volume: 1 },
      ],
    } as any);
    await settle();
  });
}

const OK = (p: number) => ({
  kind: 'ok',
  points: [
    { time: 1000, price: 10 },
    { time: 2000, price: p },
  ],
});

describe('useGhostLine — rejected vs empty', () => {
  beforeEach(() => {
    useTradeStore.setState({ ohlcCandles: [] as OhlcCandle[], predictiveSignals: [] } as any);
    useChartUIStore.setState({ ghostLineMode: 'curved' } as any);
    useFeatureStore.setState({ access: { ...ALL_SWITCHES_OFF, ghostline: true } } as any);
    projection.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it('keeps the previous line when a projection is rejected', async () => {
    projection.mockResolvedValueOnce(OK(11));
    const { widget, chart, onChart } = makeWidget();
    renderHook(() => useGhostLine(widget, 'NIFTY', '10m'));
    await act(settle);
    expect(onChart.size).toBe(1);
    const drawnId = [...onChart][0];

    projection.mockResolvedValue({ kind: 'rejected', reason: 'price-band guard' });
    await newBar(600_000);

    // The entity is untouched: not removed, not redrawn.
    expect(onChart.size).toBe(1);
    expect([...onChart][0]).toBe(drawnId);
    expect(chart.removeEntity).not.toHaveBeenCalled();
  });

  it('clears immediately when the projection is empty', async () => {
    projection.mockResolvedValueOnce(OK(11));
    const { widget, onChart } = makeWidget();
    renderHook(() => useGhostLine(widget, 'NIFTY', '10m'));
    await act(settle);
    expect(onChart.size).toBe(1);

    projection.mockResolvedValue({ kind: 'empty', reason: 'no candles' });
    await newBar(600_000);
    expect(onChart.size).toBe(0);
  });

  it('clears after a sustained rejection streak so a stale line cannot persist', async () => {
    projection.mockResolvedValueOnce(OK(11));
    const { widget, onChart } = makeWidget();
    renderHook(() => useGhostLine(widget, 'NIFTY', '10m'));
    await act(settle);
    expect(onChart.size).toBe(1);

    projection.mockResolvedValue({ kind: 'rejected', reason: 'price-band guard' });
    await newBar(600_000);
    expect(onChart.size).toBe(1); // 1st rejection — line kept
    await newBar(1_200_000);
    expect(onChart.size).toBe(1); // 2nd rejection — still kept
    await newBar(1_800_000);
    expect(onChart.size).toBe(0); // 3rd — give up and clear
  });

  it('a good projection after a rejection resets the streak', async () => {
    projection.mockResolvedValueOnce(OK(11));
    const { widget, onChart } = makeWidget();
    renderHook(() => useGhostLine(widget, 'NIFTY', '10m'));
    await act(settle);

    projection.mockResolvedValueOnce({ kind: 'rejected', reason: 'transient' });
    await newBar(600_000);
    expect(onChart.size).toBe(1);

    projection.mockResolvedValueOnce(OK(12));
    await newBar(1_200_000);
    expect(onChart.size).toBe(1);

    // Two more rejections must NOT clear — the counter restarted at the good draw.
    projection.mockResolvedValue({ kind: 'rejected', reason: 'transient' });
    await newBar(1_800_000);
    await newBar(2_400_000);
    expect(onChart.size).toBe(1);
  });

  it('passes the chart right-offset through as the projection-length cap', async () => {
    projection.mockResolvedValue(OK(11));
    const { widget } = makeWidget();
    renderHook(() => useGhostLine(widget, 'NIFTY', '10m'));
    await act(settle);
    // 7th argument is maxProjectionBars, derived from timeScale().rightOffset().
    expect(projection.mock.calls[0][6]).toBe(10);
  });
});
