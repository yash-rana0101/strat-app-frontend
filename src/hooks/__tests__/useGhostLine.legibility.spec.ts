/**
 * @vitest-environment jsdom
 */
// Feature: ghost-line-consistency
//
// Two reasons the ghost read as "very thin to notice":
//
// 1. DASHES. `linestyle: 2` is a fixed ~8px dash period. The projection's
//    horizontal extent per segment is one bar of spacing, which shrinks as the
//    user zooms out: on a 1200px pane, 200 visible bars gives 6px per bar and
//    400 bars gives 3px — under one dash cell per segment, so the stroke
//    degrades to sparse dots and then to nothing. The segment fallback already
//    forced solid for a related reason; the polyline path did not, so the same
//    feature looked different depending on which path ran.
//
// 2. LENGTH. TradingView's `defaultRightOffset` is 10 bars in the vendored
//    bundle and the widget never configures `time_scale`, so a 20-bar
//    projection was drawn half outside the viewport — the user saw a stub whose
//    visible length changed with zoom.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGhostLine, pointsUnchanged } from '../useGhostLine';
import { clampProjectionBars } from '../ghostLineComputation';
import { useTradeStore, type OhlcCandle } from '../../store/useTradeStore';
import { useChartUIStore } from '../../store/useChartUIStore';
import { useFeatureStore } from '../../store/useFeatureStore';
import { ALL_SWITCHES_OFF } from '../../lib/featureFlags';

const projection = vi.fn();
vi.mock('../ghostLineComputation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ghostLineComputation')>();
  return {
    // Keep the REAL clampProjectionBars — it is under test here.
    clampProjectionBars: actual.clampProjectionBars,
    computeGhostProjection: (...args: unknown[]) => projection(...args),
  };
});

function makeWidget(rightOffset = 10) {
  const shapes: { shape: string; overrides: Record<string, unknown> }[] = [];
  let n = 0;
  const chart = {
    getVisibleRange: () => ({ from: 0, to: 1000 }),
    onVisibleRangeChanged: () => ({ subscribe: () => {}, unsubscribeAll: () => {} }),
    timeScale: () => ({ rightOffset: () => rightOffset }),
    createMultipointShape: vi.fn(async (_pts: unknown[], opts: any) => {
      shapes.push({ shape: opts.shape, overrides: opts.overrides });
      return `id-${++n}`;
    }),
    removeEntity: vi.fn(),
  };
  const widget = {
    onChartReady: (cb: () => void) => cb(),
    chartReady: async () => {},
    activeChart: () => chart,
  };
  return { widget, shapes };
}

const settle = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

const okPoints = {
  kind: 'ok',
  points: [
    { time: 1000, price: 10 },
    { time: 2000, price: 11 },
    { time: 3000, price: 12 },
  ],
};

describe('ghost line is drawn solid on every path', () => {
  beforeEach(() => {
    useTradeStore.setState({ ohlcCandles: [] as OhlcCandle[], predictiveSignals: [] } as any);
    useFeatureStore.setState({ access: { ...ALL_SWITCHES_OFF, ghostline: true } } as any);
    projection.mockReset();
    projection.mockResolvedValue(okPoints);
  });
  afterEach(() => vi.clearAllMocks());

  it('curved mode draws a SOLID polyline (linestyle 0), not dashed', () => {
    useChartUIStore.setState({ ghostLineMode: 'curved' } as any);
    const { widget, shapes } = makeWidget();
    return act(async () => {
      renderHook(() => useGhostLine(widget, 'NIFTY', '10m'));
      await settle();
    }).then(() => {
      expect(shapes).toHaveLength(1);
      expect(shapes[0].shape).toBe('polyline');
      expect(shapes[0].overrides.linestyle).toBe(0);
    });
  });

  it('straight mode draws a SOLID trend_line (linestyle 0), not dashed', async () => {
    useChartUIStore.setState({ ghostLineMode: 'linear' } as any);
    const { widget, shapes } = makeWidget();
    renderHook(() => useGhostLine(widget, 'NIFTY', '10m'));
    await act(settle);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].shape).toBe('trend_line');
    expect(shapes[0].overrides.linestyle).toBe(0);
  });
});

describe('clampProjectionBars — keep the whole line on screen', () => {
  it('caps the projection at the visible right-hand whitespace', () => {
    // The vendored default is 10 bars of future whitespace.
    expect(clampProjectionBars(10)).toBe(10);
    expect(clampProjectionBars(4)).toBe(4);
  });

  it('never exceeds the 20-bar ceiling or drops below the 3-bar floor', () => {
    expect(clampProjectionBars(500)).toBe(20);
    expect(clampProjectionBars(1)).toBe(3);
  });

  it('falls back to the ceiling when the chart cannot report an offset', () => {
    expect(clampProjectionBars(NaN)).toBe(20);
    expect(clampProjectionBars(0)).toBe(20);
    expect(clampProjectionBars(-5)).toBe(20);
  });
});

describe('pointsUnchanged — epsilon is sized to the price tick', () => {
  // NSE quotes to one paisa. The guard's job is to absorb float noise without
  // ever swallowing a real tick. A fixed 1e-4 was 4e-9 relative on a ₹25,000
  // index, so it never fired and every pulse paid a full IPC redraw; a purely
  // relative epsilon has the opposite failure (1e-6 of ₹25,000 is 2.5 paisa,
  // which hides real moves). Half a paisa is right at both scales.
  const at = (base: number, delta: number) => [
    { time: 1, price: base },
    { time: 2, price: base + delta },
  ];

  it('treats float noise as unchanged at index scale', () => {
    expect(pointsUnchanged(at(25_000, 0), at(25_000, 1e-9))).toBe(true);
  });

  it('still detects a real one-paisa move at index scale', () => {
    expect(pointsUnchanged(at(25_000, 0), at(25_000, 0.01))).toBe(false);
  });

  it('detects a one-paisa move on a low-priced option', () => {
    expect(pointsUnchanged(at(40, 0), at(40, 0.01))).toBe(false);
  });

  it('absorbs sub-tick jitter at both scales', () => {
    expect(pointsUnchanged(at(40, 0), at(40, 1e-9))).toBe(true);
    expect(pointsUnchanged(at(25_000, 0), at(25_000, 0.0001))).toBe(true);
  });
});
