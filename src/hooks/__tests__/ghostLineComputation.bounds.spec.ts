// Regression: Ghost Line must never paint a vertical "crash to ~0" amber line.
//
// Engines used to floor at Math.max(0.01, price). On index-scale anchors that
// rendered as a plunge to the bottom of the chart. `applyGhostBounds` now
// rejects / clips relative to the anchor (±20% band, price-relative step/total).

import { describe, it, expect } from 'vitest';

import {
  applyGhostBounds,
  GHOST_PRICE_BAND,
  GHOST_MAX_TOTAL_FRAC,
  path1SignalApplies,
  PATH1_MIN_CONFIDENCE,
  priceBand,
  sanitizeLookback,
  vweprProjection,
} from '../ghostLineComputation';

function quadraticCandles(
  count: number,
  base: number,
  linearSlope: number,
  curve: number
): { time: number; close: number; volume: number; high: number; low: number }[] {
  const out = [];
  for (let i = 0; i < count; i++) {
    const close = base + linearSlope * i + curve * i * i;
    out.push({ time: 1000 + i * 60, close, volume: 1000, high: close + 1, low: close - 1 });
  }
  return out;
}

describe('applyGhostBounds — no floor-crash', () => {
  it('rejects a first forward step that leaves the ±20% band', () => {
    const anchor = 25_000;
    const { lo } = priceBand(anchor);
    const raw = [
      { time: 1, price: anchor },
      { time: 2, price: lo - 1 }, // outside band on first step
      { time: 3, price: 0.01 },
    ];
    expect(applyGhostBounds(raw, 'curved', [anchor, anchor], anchor)).toEqual([]);
  });

  it('clips a runaway curved projection into the band (never near-zero)', () => {
    const anchor = 25_000;
    const raw = Array.from({ length: 8 }, (_, i) => ({
      time: 1_700_000_000 + i * 60,
      // Pathological dive toward the old 0.01 floor
      price: i === 0 ? anchor : 0.01,
    }));
    // First step is 0.01 — outside band → discard entirely
    expect(applyGhostBounds(raw, 'curved', Array(20).fill(anchor), anchor)).toEqual([]);
  });

  it('keeps a mild VWEPR curve inside the band after bounds', () => {
    // Gentle acceleration so first step stays in-band; clamp must not flatten
    // all curvature, but every price stays within ±20% of anchor.
    const candles = quadraticCandles(50, /*base=*/ 100, /*linearSlope=*/ 0.2, /*curve=*/ 0.002);
    const lastTime = candles[candles.length - 1].time;
    const pts = vweprProjection(candles, lastTime, 60, 6);
    expect(pts.length).toBe(7);

    const anchor = pts[0].price;
    const bounded = applyGhostBounds(
      pts,
      'curved',
      candles.map((c) => c.close),
      anchor
    );
    expect(bounded.length).toBe(pts.length);
    const { lo, hi } = priceBand(anchor);
    for (const p of bounded) {
      expect(p.price).toBeGreaterThanOrEqual(lo - 1e-9);
      expect(p.price).toBeLessThanOrEqual(hi + 1e-9);
      expect(p.price).toBeGreaterThan(anchor * 0.5); // never "crash to half"
    }
    expect(Math.abs(bounded[bounded.length - 1].price - anchor)).toBeLessThanOrEqual(
      anchor * GHOST_MAX_TOTAL_FRAC + 1e-6
    );
  });

  it('rejects a straight projection whose end leaves the band', () => {
    const anchor = 100;
    const raw = [
      { time: 1, price: anchor },
      { time: 2, price: 105 }, // first step ok
      { time: 3, price: 150 }, // end outside ±20%
    ];
    expect(applyGhostBounds(raw, 'linear', [100, 101], anchor)).toEqual([]);
  });
});

describe('sanitizeLookback', () => {
  it('drops non-finite / non-positive bars', () => {
    const clean = sanitizeLookback([
      { time: 1, close: 100, volume: 1, high: 101, low: 99 },
      { time: 2, close: 0, volume: 1, high: 1, low: 0 },
      { time: 3, close: NaN, volume: 1, high: 1, low: 1 },
      { time: 4, close: 102, volume: 1, high: 103, low: 101 },
    ]);
    expect(clean.map((c) => c.close)).toEqual([100, 102]);
  });
});

describe('path1SignalApplies — confidence + uniform times', () => {
  const base = {
    symbol: 'RELIANCE',
    target_timestamp_ms: (100_000 + 600) * 1000,
    predicted_close_price: 105,
    confidence_score: 80,
  };

  it(`requires confidence >= ${PATH1_MIN_CONFIDENCE}`, () => {
    expect(
      path1SignalApplies({
        ghostLineMode: 'forecast',
        predictiveSignals: [{ ...base, confidence_score: PATH1_MIN_CONFIDENCE - 1 }],
        activeSymbol: 'RELIANCE',
        last: { time: 100_000, close: 100 },
        intervalSec: 60,
      })
    ).toBe(false);

    expect(
      path1SignalApplies({
        ghostLineMode: 'forecast',
        predictiveSignals: [base],
        activeSymbol: 'RELIANCE',
        last: { time: 100_000, close: 100 },
        intervalSec: 60,
      })
    ).toBe(true);
  });

  it('still rejects deviation outside the price band', () => {
    expect(
      path1SignalApplies({
        ghostLineMode: 'forecast',
        predictiveSignals: [
          { ...base, predicted_close_price: 100 * (1 + GHOST_PRICE_BAND + 0.01) },
        ],
        activeSymbol: 'RELIANCE',
        last: { time: 100_000, close: 100 },
        intervalSec: 60,
      })
    ).toBe(false);
  });
});
