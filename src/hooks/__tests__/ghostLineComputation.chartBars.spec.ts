// Feature: ghost-line-anchor
//
// The lookback now comes from the TradingView chart itself (`exportData`), so
// the anchor is the last DISPLAYED bar at its live close on every resolution.
// These tests pin the mapping from TradingView's `ExportedData` shape onto
// lookback bars, and the interval precedence for chart-sourced bars (median
// gap of the displayed bars wins over the TIMEFRAME_MS map).

import { describe, it, expect, vi } from 'vitest';

import {
  exportedDataToBars,
  readChartBars,
  resolveIntervalSec,
} from '../ghostLineComputation';

const schema = [
  { type: 'time' },
  { type: 'value', sourceType: 'series', plotTitle: 'open', sourceTitle: 'NIFTY, NSE' },
  { type: 'value', sourceType: 'series', plotTitle: 'high', sourceTitle: 'NIFTY, NSE' },
  { type: 'value', sourceType: 'series', plotTitle: 'low', sourceTitle: 'NIFTY, NSE' },
  { type: 'value', sourceType: 'series', plotTitle: 'close', sourceTitle: 'NIFTY, NSE' },
];

/** `count` display bars spaced `stepSec` apart ending at `lastSec`. */
function rows(count: number, stepSec: number, lastSec: number, withVolume = false) {
  const out: Float64Array[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const t = lastSec - i * stepSec;
    const c = 24000 + (count - i);
    const row = [t, c - 1, c + 2, c - 2, c];
    if (withVolume) row.push(1000 + i);
    out.push(Float64Array.from(row));
  }
  return out;
}

describe('exportedDataToBars', () => {
  it('maps time/OHLC columns by schema, not by position', () => {
    // Shuffle the column order: exportData's schema is authoritative.
    const shuffled = [schema[4], schema[0], schema[2], schema[1], schema[3]];
    const data = [Float64Array.from([100.5, 1_000, 101, 99.5, 99])];
    const bars = exportedDataToBars({ schema: shuffled, data });
    expect(bars).toEqual([{ time: 1_000, close: 100.5, high: 101, low: 99, volume: 1 }]);
  });

  it('takes volume from a Volume study column when present, else 1', () => {
    const withVol = [...schema, { type: 'value', sourceType: 'study', plotTitle: 'Volume', sourceTitle: 'Volume' }];
    const bars = exportedDataToBars({ schema: withVol, data: rows(3, 60, 3_000, true) });
    expect(bars.map((b) => b.volume)).toEqual([1002, 1001, 1000]);
    const noVol = exportedDataToBars({ schema, data: rows(3, 60, 3_000) });
    expect(noVol.every((b) => b.volume === 1)).toBe(true);
  });

  it('drops rows without a finite close (whitespace / gap rows)', () => {
    const data = [Float64Array.from([1_000, 1, 2, 0, NaN]), Float64Array.from([1_060, 1, 2, 0, 1.5])];
    expect(exportedDataToBars({ schema, data }).map((b) => b.time)).toEqual([1_060]);
  });

  it('returns [] when there is no close series', () => {
    expect(exportedDataToBars({ schema: [schema[0]], data: [Float64Array.from([1])] })).toEqual([]);
  });
});

describe('readChartBars', () => {
  it('returns [] for a missing chart or a throwing exportData', async () => {
    expect(await readChartBars(null)).toEqual([]);
    const throwing = { exportData: vi.fn(async () => { throw new Error('torn down'); }) };
    expect(await readChartBars(throwing)).toEqual([]);
  });

  it('asks for the series plus studies (volume) and maps the rows', async () => {
    const exportData = vi.fn(async () => ({ schema, data: rows(25, 4_500, 1_788_498_000) }));
    const bars = await readChartBars({ exportData });
    expect(exportData).toHaveBeenCalledWith({ includeTime: true, includeSeries: true, includedStudies: 'all' });
    expect(bars).toHaveLength(25);
    expect(bars[bars.length - 1].time).toBe(1_788_498_000);
  });
});

describe('resolveIntervalSec with chart-sourced bars', () => {
  it('infers the display step from the displayed bars (75m chart → 4500s)', () => {
    const bars = exportedDataToBars({ schema, data: rows(30, 4_500, 1_000_000) });
    expect(resolveIntervalSec('75m', bars, true)).toBe(4_500);
  });

  it('uses the display map for calendar resolutions (1M), not the observed gap', () => {
    // Real month-to-month gaps vary (28–31 days) and the map says 30. That
    // difference used to matter because monthly slots were stepped by
    // `intervalSec`; `nextSessionSlots` now steps DWM by real calendar units
    // and only reads the interval to choose that branch, so the map's
    // approximation is harmless — and preferring the map keeps `4h` (2 bars per
    // NSE session) from ever resolving to its 20h overnight gap.
    const data = [
      Float64Array.from([Date.UTC(2026, 5, 1) / 1000, 1, 1, 1, 1]),
      Float64Array.from([Date.UTC(2026, 6, 1) / 1000, 1, 1, 1, 1]),
      Float64Array.from([Date.UTC(2026, 7, 1) / 1000, 1, 1, 1, 1]),
      Float64Array.from([Date.UTC(2026, 8, 1) / 1000, 1, 1, 1, 1]),
    ];
    const bars = exportedDataToBars({ schema, data });
    expect(resolveIntervalSec('1M', bars, true)).toBe(30 * 86_400);
    expect(resolveIntervalSec('1M', bars, false)).toBe(30 * 86_400);
  });

  it('is unaffected by an overnight gap (5 bars, one 19h gap)', () => {
    const t = 1_788_498_000;
    const data = [t - 68_400 - 3 * 4_500, t - 68_400 - 2 * 4_500, t - 68_400 - 4_500, t - 68_400, t].map((x) =>
      Float64Array.from([x, 1, 1, 1, 1])
    );
    const bars = exportedDataToBars({ schema, data });
    expect(resolveIntervalSec('75m', bars, true)).toBe(4_500);
  });

  it('resolves 4h to 4h even though NSE fits only 2 four-hour bars per session', () => {
    // Regression: the session is 375 minutes, so a 4h chart has bars at 09:15
    // and 13:15 and the gap sequence alternates 4h / 20h. Inferring the step
    // from those gaps returned 72000s (20h) for half of all last-bar
    // positions, and every projected point then landed off TradingView's grid
    // and collapsed onto the last candle.
    const IST = 19_800, OPEN = 33_300;
    const times: number[] = [];
    let day = Math.floor(Date.UTC(2026, 8, 4) / 1000) - IST - 10 * 86_400;
    for (let d = 0; d < 10; d++) {
      const dow = new Date((day + OPEN) * 1000).getUTCDay();
      if (dow !== 0 && dow !== 6) {
        times.push(day + OPEN);
        times.push(day + OPEN + 14_400);
      }
      day += 86_400;
    }
    const data = times.map((x) => Float64Array.from([x, 1, 1, 1, 1]));
    const bars = exportedDataToBars({ schema, data });
    expect(resolveIntervalSec('4h', bars, true)).toBe(14_400);
    // ...and from every intra-session truncation, not just this one.
    expect(resolveIntervalSec('4h', bars.slice(0, -1), true)).toBe(14_400);
  });

  it('store-sourced bars still use the display map (2m chart over 1-minute bars)', () => {
    const bars = exportedDataToBars({ schema, data: rows(60, 60, 1_000_000) });
    expect(resolveIntervalSec('2m', bars, false)).toBe(120);
  });
});
