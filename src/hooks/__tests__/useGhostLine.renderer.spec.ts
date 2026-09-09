/**
 * @vitest-environment jsdom
 */
// Feature: ghost-line-anchor
//
// The ghost entity is owned by `GhostLineRenderer` for the widget's lifetime,
// not by the draw effect. Invariants pinned here:
//
//   · A redraw draws the NEW entity before removing the OLD one (no empty
//     frame), and exactly one entity is on the chart afterwards.
//   · A re-run whose projection is unchanged leaves the entity on the chart —
//     the old cleanup-then-skip path removed it and drew nothing, which is the
//     "line vanishes for a bar" report.
//   · Curved modes draw ONE `polyline`; straight modes draw ONE `trend_line`.
//   · The chart's own series is handed to the projection (`exportData`).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGhostLine, GhostLineRenderer } from '../useGhostLine';
import { useTradeStore, type OhlcCandle } from '../../store/useTradeStore';
import { useChartUIStore } from '../../store/useChartUIStore';
import { useFeatureStore } from '../../store/useFeatureStore';
import { ALL_SWITCHES_OFF } from '../../lib/featureFlags';

const computeGhostPoints = vi.fn();
vi.mock('../ghostLineComputation', () => ({
  // The hook consumes the discriminated `computeGhostProjection`; the mock keeps
  // returning a plain array of points and adapts here, so each test stays a
  // statement about points-in / entities-on-chart rather than about the wrapper.
  computeGhostProjection: async (...args: unknown[]) => {
    const points = await computeGhostPoints(...args);
    return Array.isArray(points) && points.length >= 2
      ? { kind: 'ok', points }
      : { kind: 'empty', reason: 'test stub returned no points' };
  },
  clampProjectionBars: () => 20,
}));

function makeWidget() {
  const onChart = new Set<string>();
  const shapes: { id: string; shape: string; points: number }[] = [];
  let n = 0;
  const chart = {
    getVisibleRange: () => ({ from: 0, to: 1000 }),
    onVisibleRangeChanged: () => ({ subscribe: () => {}, unsubscribeAll: () => {} }),
    exportData: vi.fn(async () => ({ schema: [], data: [] })),
    createMultipointShape: vi.fn(async (pts: unknown[], opts: { shape: string }) => {
      const id = `id-${++n}`;
      onChart.add(id);
      shapes.push({ id, shape: opts.shape, points: pts.length });
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
  return { widget, chart, onChart, shapes };
}

const settle = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

describe('GhostLineRenderer', () => {
  it('draws the new entity before removing the old one and ends with exactly one', async () => {
    const { chart, onChart } = makeWidget();
    const r = new GhostLineRenderer(chart);
    const order: string[] = [];
    chart.createMultipointShape.mockImplementation(async () => {
      order.push('create');
      onChart.add('x');
      return 'x';
    });
    chart.removeEntity.mockImplementation((id: string) => {
      order.push(`remove:${id}`);
      onChart.delete(id);
    });
    await r.render([{ time: 1, price: 1 }, { time: 2, price: 2 }], false, () => false);
    chart.createMultipointShape.mockImplementation(async () => {
      order.push('create');
      onChart.add('y');
      return 'y';
    });
    await r.render([{ time: 1, price: 1 }, { time: 2, price: 3 }], false, () => false);
    expect(order).toEqual(['create', 'create', 'remove:x']);
    expect([...onChart]).toEqual(['y']);
  });

  it('a stale run removes its own entity and leaves the previous one', async () => {
    const { chart, onChart } = makeWidget();
    const r = new GhostLineRenderer(chart);
    await r.render([{ time: 1, price: 1 }, { time: 2, price: 2 }], false, () => false);
    const ok = await r.render([{ time: 1, price: 1 }, { time: 2, price: 3 }], false, () => true);
    expect(ok).toBe(false);
    expect([...onChart]).toEqual(['id-1']);
  });
});

describe('useGhostLine draw path', () => {
  beforeEach(() => {
    useTradeStore.setState({ ohlcCandles: [] as OhlcCandle[], predictiveSignals: [] } as any);
    useChartUIStore.setState({ ghostLineMode: 'curved' } as any);
    useFeatureStore.setState({ access: { ...ALL_SWITCHES_OFF, ghostline: true } } as any);
    computeGhostPoints.mockReset();
    computeGhostPoints.mockResolvedValue([
      { time: 1000, price: 10 },
      { time: 2000, price: 11 },
      { time: 3000, price: 12.5 },
    ]);
  });
  afterEach(() => vi.clearAllMocks());

  it('passes the chart into computeGhostPoints and draws one polyline in curved mode', async () => {
    const { widget, chart, shapes, onChart } = makeWidget();
    renderHook(() => useGhostLine(widget, 'NIFTY', '75m'));
    await act(settle);
    expect(computeGhostPoints).toHaveBeenCalledTimes(1);
    expect(computeGhostPoints.mock.calls[0][5]).toBe(chart);
    expect(shapes).toEqual([{ id: 'id-1', shape: 'polyline', points: 3 }]);
    expect(onChart.size).toBe(1);
  });

  it('draws one trend_line (anchor → end) in a straight mode', async () => {
    useChartUIStore.setState({ ghostLineMode: 'linear' } as any);
    const { widget, shapes } = makeWidget();
    renderHook(() => useGhostLine(widget, 'NIFTY', '10m'));
    await act(settle);
    expect(shapes).toEqual([{ id: 'id-1', shape: 'trend_line', points: 2 }]);
  });

  it('keeps the entity on the chart when a re-run produces unchanged points', async () => {
    const { widget, chart, onChart } = makeWidget();
    renderHook(() => useGhostLine(widget, 'NIFTY', '10m'));
    await act(settle);
    expect(onChart.size).toBe(1);

    // A new bar re-fires the effect; the projection is byte-identical.
    await act(async () => {
      useTradeStore.setState({
        ohlcCandles: [
          { symbol: 'NIFTY', start_timestamp_ms: 600_000, open: 1, high: 1, low: 1, close: 1, volume: 1 },
        ],
      } as any);
      await settle();
    });
    expect(computeGhostPoints).toHaveBeenCalledTimes(2);
    expect(chart.removeEntity).not.toHaveBeenCalled();
    expect(onChart.size).toBe(1);
  });

  it('clears the entity when the symbol changes, and on unmount', async () => {
    const { widget, onChart } = makeWidget();
    const { rerender, unmount } = renderHook(({ sym }) => useGhostLine(widget, sym, '10m'), {
      initialProps: { sym: 'NIFTY' },
    });
    await act(settle);
    expect(onChart.size).toBe(1);
    computeGhostPoints.mockResolvedValue([]);
    rerender({ sym: 'RELIANCE' });
    await act(settle);
    expect(onChart.size).toBe(0);
    computeGhostPoints.mockResolvedValue([{ time: 1, price: 1 }, { time: 2, price: 2 }]);
    rerender({ sym: 'TCS' });
    await act(settle);
    expect(onChart.size).toBe(1);
    unmount();
    expect(onChart.size).toBe(0);
  });
});
