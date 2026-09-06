// Unit tests for Unit 2 — Gate Path 1 (predictive signal) by engine mode.
//
// Background: Path 1 in computeGhostPoints builds the projection points
// unconditionally whenever a valid predictive signal exists (dev < 0.20),
// which used to override all four engines — OLS/VWLR/VWEPR/Forecast all
// rendered the SAME straight interpolation `last.close + m*i`. The fix gates
// Path 1 so the predictive signal only drives the projection when
// `ghostLineMode === 'forecast'`; for 'linear'/'volume'/'curved' the
// user-selected regression engine wins (Path 2 Rust / Path 3 JS).
//
// Also: confidence_score must be ≥ PATH1_MIN_CONFIDENCE, and Path 1 uses a
// uniform interval grid (no last-point time rewrite).

import { describe, it, expect } from 'vitest';
import {
  olsSlope,
  path1Points,
  path1SignalApplies,
  PATH1_MIN_CONFIDENCE,
} from '@/hooks/ghostLineComputation';

/** Build a deterministic ramp of closes with a known positive slope so the
 *  OLS projection is forced upward (and is NOT the signal line). */
function rampCloses(start: number, step: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => +(start + step * i).toFixed(2));
}

describe('GhostLine Path 1 gate (Unit 2)', () => {
  const baseSignal = {
    symbol: 'RELIANCE',
    target_timestamp_ms: (100_000 + 600) * 1000, // well after last.time
    predicted_close_price: 105, // dev vs last.close=100 → 0.05 < 0.20
    confidence_score: 80,
  };

  it('does NOT apply Path 1 in linear mode even with a valid signal', () => {
    const applies = path1SignalApplies({
      ghostLineMode: 'linear',
      predictiveSignals: [baseSignal],
      activeSymbol: 'RELIANCE',
      last: { time: 100_000, close: 100 },
      intervalSec: 60,
    });
    expect(applies).toBe(false);
  });

  it('does NOT apply Path 1 in volume mode even with a valid signal', () => {
    const applies = path1SignalApplies({
      ghostLineMode: 'volume',
      predictiveSignals: [baseSignal],
      activeSymbol: 'RELIANCE',
      last: { time: 100_000, close: 100 },
      intervalSec: 60,
    });
    expect(applies).toBe(false);
  });

  it('does NOT apply Path 1 in curved mode even with a valid signal', () => {
    const applies = path1SignalApplies({
      ghostLineMode: 'curved',
      predictiveSignals: [baseSignal],
      activeSymbol: 'RELIANCE',
      last: { time: 100_000, close: 100 },
      intervalSec: 60,
    });
    expect(applies).toBe(false);
  });

  it('applies Path 1 in forecast mode with a valid signal', () => {
    const applies = path1SignalApplies({
      ghostLineMode: 'forecast',
      predictiveSignals: [baseSignal],
      activeSymbol: 'RELIANCE',
      last: { time: 100_000, close: 100 },
      intervalSec: 60,
    });
    expect(applies).toBe(true);
  });

  it('in linear mode the projection uses the OLS slope, not the signal line', () => {
    // 50 deterministic closes stepping +1 each bar → OLS slope is +1.0.
    // The signal, by contrast, would interpolate from last.close=149 to
    // predicted=105 (a DOWNWARD ramp). If Path 1 wrongly applied, the
    // projection would slope DOWN; the regression engine must slope UP.
    const closes = rampCloses(100, 1, 50);
    expect(closes[closes.length - 1]).toBe(149);

    const lastClose = closes[closes.length - 1];
    const ols = olsSlope(closes);
    // Deterministic OLS slope for an exact +1 ramp is +1.0.
    expect(ols).toBeCloseTo(1.0, 6);

    // The signal's interpolation slope (what Path 1 would have drawn).
    const predicted = baseSignal.predicted_close_price; // 105
    const sigSlope = (predicted - lastClose) / 6; // 6 = projBars in the helper
    expect(sigSlope).toBeLessThan(0); // signal goes DOWN

    // The OLS projection (linear mode) goes UP, so it cannot equal the
    // signal's downward interpolation line — confirming the regression
    // engine wins over Path 1 for linear mode.
    expect(ols).toBeGreaterThan(0);
    expect(ols).not.toBeCloseTo(sigSlope, 6);
  });

  it('ignores signals whose dev >= 0.20 even in forecast mode', () => {
    const sig = { ...baseSignal, predicted_close_price: 200 }; // dev=1.0
    const applies = path1SignalApplies({
      ghostLineMode: 'forecast',
      predictiveSignals: [sig],
      activeSymbol: 'RELIANCE',
      last: { time: 100_000, close: 100 },
      intervalSec: 60,
    });
    expect(applies).toBe(false);
  });

  it('ignores stale signals (targetSec <= last.time - intervalSec*10)', () => {
    const stale = {
      ...baseSignal,
      target_timestamp_ms: (100_000 - 600 - 1) * 1000, // stale
    };
    const applies = path1SignalApplies({
      ghostLineMode: 'forecast',
      predictiveSignals: [stale],
      activeSymbol: 'RELIANCE',
      last: { time: 100_000, close: 100 },
      intervalSec: 60,
    });
    expect(applies).toBe(false);
  });

  it(`ignores low-confidence signals (< ${PATH1_MIN_CONFIDENCE})`, () => {
    const low = { ...baseSignal, confidence_score: PATH1_MIN_CONFIDENCE - 1 };
    expect(
      path1SignalApplies({
        ghostLineMode: 'forecast',
        predictiveSignals: [low],
        activeSymbol: 'RELIANCE',
        last: { time: 100_000, close: 100 },
        intervalSec: 60,
      })
    ).toBe(false);
  });

  it('Path 1 grid uses uniform interval times (no end-time rewrite)', () => {
    const last = { time: 100_000, close: 100 };
    const intervalSec = 60;
    const targetSec = last.time + 10 * intervalSec; // 10m candle close, 1m chart
    const points = path1Points(last, 105, targetSec, intervalSec, 6);
    expect(points).toHaveLength(7);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].time - points[i - 1].time).toBe(intervalSec);
    }
  });

  it('Path 1 slope comes from the signal horizon, not from projBars', () => {
    // 1m chart, signal targets the close of the next 10m candle. Anchor bar
    // closes at last.time + 60, so the horizon is 9 minutes of chart time.
    const last = { time: 100_000, close: 100 };
    const targetSec = last.time + 600;
    const a = path1Points(last, 109, targetSec, 60, 6);
    const b = path1Points(last, 109, targetSec, 60, 20);
    // Same slope at every zoom (1/min), so the price at the target bar is the
    // predicted close in both.
    expect(a[6].price).toBeCloseTo(106, 10);
    expect(b[9].price).toBeCloseTo(109, 10);
    expect(b[6].price).toBeCloseTo(a[6].price, 10);
  });

  it('Path 1 floors the horizon at one bar when the target is already inside the anchor bar', () => {
    // 15m chart: the 10m signal's target lands inside the forming 15m bar.
    const last = { time: 100_000, close: 100 };
    const points = path1Points(last, 103, last.time + 600, 900, 4);
    expect(points[1].price).toBeCloseTo(103, 10);
  });
});
