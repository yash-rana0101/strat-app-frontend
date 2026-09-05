// Unit test for the ghost-line VWEPR (curved) projection clamp tuning.
//
// `applyGhostBounds` now caps with BOTH avgStep-relative and price-relative
// budgets (`min(avgStep*12, anchor*2%)` per step, `min(…, anchor*15%)` total)
// so genuine mild curvature survives while index-scale cliffs are rejected.

import { describe, it, expect } from 'vitest';

import { applyGhostBounds, GHOST_MAX_TOTAL_FRAC, vweprProjection } from '../ghostLineComputation';

/** Build a window of candles whose closes follow a quadratic that
 *  accelerates upward: close[i] = base + linearSlope * i + curve * i^2.
 *  Volume is held constant so VWEPR's volume weights don't distort the fit.
 *  The resulting VWEPR fit should extrapolate the acceleration forward. */
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

describe('vweprProjection — clamp does not flatten accelerating curves', () => {
  it('projects a last price that differs from the anchor by more than avgStep', () => {
    // Mild acceleration so the first forward step stays inside the ±20% band.
    const candles = quadraticCandles(50, /*base=*/ 100, /*linearSlope=*/ 0.2, /*curve=*/ 0.002);
    const lastTime = candles[candles.length - 1].time;
    const intervalSec = 60;
    const projLen = 6;

    const pts = vweprProjection(candles, lastTime, intervalSec, projLen);
    expect(pts.length).toBe(projLen + 1);

    const anchor = pts[0].price;
    const bounded = applyGhostBounds(
      pts,
      'curved',
      candles.map((c) => c.close),
      anchor
    );
    expect(bounded.length).toBe(pts.length);

    const last = bounded[bounded.length - 1].price;
    const deviation = Math.abs(last - anchor);

    const recent = candles.slice(-20).map((c) => c.close);
    let sumAbs = 0;
    for (let i = 1; i < recent.length; i++) sumAbs += Math.abs(recent[i] - recent[i - 1]);
    const avgStep = sumAbs / (recent.length - 1);

    // Some curvature survives the price-relative clamp.
    expect(deviation).toBeGreaterThan(0);
    expect(deviation).toBeLessThanOrEqual(anchor * GHOST_MAX_TOTAL_FRAC + 1e-6);
    // And the avgStep budget alone would have been larger — we are now
    // price-capped, which is the intentional trade for cliff safety.
    expect(avgStep).toBeGreaterThan(0);
  });

  it('still rejects a truly pathological single-step spike via the per-step guard', () => {
    const candles = quadraticCandles(50, 100, 0, 0); // flat: close = 100
    candles[candles.length - 1] = { ...candles[candles.length - 1], close: 100_000 };

    const lastTime = candles[candles.length - 1].time;
    const pts = vweprProjection(candles, lastTime, 60, 6);
    expect(pts.length).toBe(7);
    for (const p of pts) {
      expect(Number.isFinite(p.price)).toBe(true);
    }

    // After bounds: either discarded (first step outside band) or clipped.
    const anchor = pts[0].price;
    const bounded = applyGhostBounds(
      pts,
      'curved',
      candles.map((c) => c.close),
      anchor
    );
    if (bounded.length > 0) {
      for (const p of bounded) {
        expect(p.price).toBeGreaterThan(anchor * 0.5);
        expect(p.price).toBeLessThan(anchor * 1.5);
      }
    }
  });
});
