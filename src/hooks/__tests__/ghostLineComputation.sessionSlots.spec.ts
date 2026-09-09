// Feature: ghost-line-consistency
//
// Why these assertions matter more than they look.
//
// A ghost point is handed to `chart.createMultipointShape` as a `{time, price}`
// pair. TradingView resolves the time to a bar INDEX in
// `_convertUserPointsToDataSource` (see `bundles/library.*.js`):
//
//     const a = points.closestIndexLeft(t) || 0;
//     if (t > valueAt(a) && a === range.lastIndex) {
//       const d = series.syncModel().distance(valueAt(a), t);
//       d.success && (index = index + d.result);      // <-- ONLY on success
//     }
//
// and `distance()` resolves through an EXACT lookup:
//
//     const n = this._extrapolatedData.indexOf(1000 * t);
//     return -1 === n ? { success: false } : { success: true, result: n };
//
// `_extrapolatedData` is TradingView's own session-aware future bar grid. So a
// timestamp that is not byte-exactly one of those bar times fails SILENTLY and
// the point keeps `closestIndexLeft` — the index of the LAST REAL BAR. Two such
// points share one x-coordinate and render as a vertical spike; a partially
// resolvable set renders as a zigzag. That is the reported "weird pattern", and
// there is no exception to catch.
//
// Hence: every slot must be a real future NSE trading slot, and no two slots may
// ever collapse together.

import { describe, it, expect } from 'vitest';

import { nextSessionSlots, NSE_HOLIDAYS, isOnDisplayGrid } from '../ghostLineComputation';

const IST = 19_800;
const OPEN = 33_300;
const CLOSE = 55_800;

/** UNIX seconds for a given IST wall-clock time. */
function ist(y: number, m: number, d: number, hh = 9, mm = 15): number {
  return Math.floor(Date.UTC(y, m - 1, d, hh, mm) / 1000) - IST;
}
const dateKey = (s: number) => new Date((s + IST) * 1000).toISOString().slice(0, 10);
const istSecOfDay = (s: number) => (((s + IST) % 86400) + 86400) % 86400;
const dow = (s: number) => new Date((s + IST) * 1000).getUTCDay();

/** The invariant that actually protects the rendering. */
function expectStrictlyIncreasingAndDistinct(slots: number[]) {
  expect(slots.length).toBeGreaterThan(0);
  expect(new Set(slots).size).toBe(slots.length);
  for (let i = 1; i < slots.length; i++) {
    expect(slots[i]).toBeGreaterThan(slots[i - 1]);
  }
}

describe('nextSessionSlots — intraday', () => {
  it('steps inside the session and rolls to the next session open at the close', () => {
    // 14:15 IST on Thu 2026-09-03, 1h steps: 15:15 is the last in-session slot,
    // then it must jump to Friday's 09:15 rather than 16:15.
    const slots = nextSessionSlots(ist(2026, 9, 3, 14, 15), 3600, 4);
    expectStrictlyIncreasingAndDistinct(slots);
    expect(dateKey(slots[0])).toBe('2026-09-03');
    expect(istSecOfDay(slots[0])).toBe(15 * 3600 + 15 * 60);
    expect(dateKey(slots[1])).toBe('2026-09-04');
    expect(istSecOfDay(slots[1])).toBe(OPEN);
  });

  it('never emits a time outside 09:15–15:30 IST, on any intraday interval', () => {
    for (const iv of [60, 120, 300, 600, 900, 1800, 3600, 4500, 7200, 7500, 10800, 14400]) {
      const slots = nextSessionSlots(ist(2026, 9, 3, 14, 45), iv, 12);
      expectStrictlyIncreasingAndDistinct(slots);
      for (const s of slots) {
        const sec = istSecOfDay(s);
        expect(sec).toBeGreaterThanOrEqual(OPEN);
        expect(sec).toBeLessThan(CLOSE);
        expect([0, 6]).not.toContain(dow(s));
      }
    }
  });

  it('skips the weekend from a Friday afternoon anchor', () => {
    // Fri 2026-09-04 15:15 + 1h must land on Mon 2026-09-07 09:15.
    const slots = nextSessionSlots(ist(2026, 9, 4, 15, 15), 3600, 1);
    expect(dateKey(slots[0])).toBe('2026-09-07');
    expect(istSecOfDay(slots[0])).toBe(OPEN);
  });

  it('skips an NSE holiday instead of projecting onto a closed day', () => {
    // 2026-10-02 (Gandhi Jayanti) is a Friday holiday, so a Thursday-close
    // anchor must roll to Monday 2026-10-05.
    expect(NSE_HOLIDAYS.has('2026-10-02')).toBe(true);
    const slots = nextSessionSlots(ist(2026, 10, 1, 15, 15), 3600, 1);
    expect(dateKey(slots[0])).toBe('2026-10-05');
  });

  it('never lands on any listed holiday across a long projection', () => {
    // Walk across the Diwali cluster with a full 20-bar projection.
    const slots = nextSessionSlots(ist(2026, 11, 6, 14, 15), 3600, 20);
    expectStrictlyIncreasingAndDistinct(slots);
    for (const s of slots) expect(NSE_HOLIDAYS.has(dateKey(s))).toBe(false);
  });
});

describe('nextSessionSlots — daily and above', () => {
  it('1D advances one trading day at a time, skipping weekends and holidays', () => {
    const slots = nextSessionSlots(ist(2026, 10, 1), 86_400, 5);
    expectStrictlyIncreasingAndDistinct(slots);
    // 10-02 is a holiday and 10-03/04 is a weekend.
    expect(slots.map(dateKey)).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
    ]);
    for (const s of slots) expect(istSecOfDay(s)).toBe(OPEN);
  });

  it('1W lands on week starts, not "anchor + 7 days"', () => {
    // Anchor is a THURSDAY. Weekly bars are week-anchored, so each slot must be
    // the first TRADING day of a distinct following week — never another
    // Thursday seven days on. 2026-09-14 is a listed holiday, so that week's
    // slot is correctly Tuesday the 15th rather than the Monday.
    const slots = nextSessionSlots(ist(2026, 9, 3), 604_800, 6);
    expectStrictlyIncreasingAndDistinct(slots);
    expect(slots.map(dateKey)).toEqual([
      '2026-09-07',
      '2026-09-15', // Monday 09-14 is a holiday
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
    ]);
    // Every slot is a Monday unless that Monday was a holiday.
    for (const s of slots) {
      if (dow(s) !== 1) {
        const monday = s - (dow(s) - 1) * 86_400;
        expect(NSE_HOLIDAYS.has(dateKey(monday))).toBe(true);
      }
      expect(NSE_HOLIDAYS.has(dateKey(s))).toBe(false);
    }
    // Each slot is in its own ISO week — the property that stops a collapse.
    const weeks = slots.map((s) => Math.floor((s - (dow(s) - 1) * 86_400) / 604_800));
    expect(new Set(weeks).size).toBe(weeks.length);
  });

  it('1M lands on distinct calendar months — the 30-day step collapsed two into one', () => {
    // Regression. `TIMEFRAME_MS['1M']` is a 30-day approximation, and TradingView
    // snaps every monthly point to its containing month's start. Stepping by a
    // flat 30 days puts two consecutive slots in the SAME month roughly once
    // every eight steps (e.g. from a late-January anchor: …Jul 01, Jul 31 → both
    // snap to July), so the two collapse onto one x-coordinate and draw a
    // vertical segment.
    for (const anchor of [ist(2026, 1, 30), ist(2026, 3, 2), ist(2026, 8, 31), ist(2026, 5, 15)]) {
      const slots = nextSessionSlots(anchor, 2_592_000, 8);
      expectStrictlyIncreasingAndDistinct(slots);
      const months = slots.map((s) => dateKey(s).slice(0, 7));
      expect(new Set(months).size).toBe(months.length);
    }
  });

  it('1M slots are the first TRADING day of each month', () => {
    // 2026-01-01 is a Thursday but a market holiday in most years; whatever the
    // calendar does, the slot must be a real trading day at the session open.
    const slots = nextSessionSlots(ist(2025, 12, 15), 2_592_000, 6);
    for (const s of slots) {
      expect([0, 6]).not.toContain(dow(s));
      expect(NSE_HOLIDAYS.has(dateKey(s))).toBe(false);
      expect(istSecOfDay(s)).toBe(OPEN);
    }
  });
});

describe('isOnDisplayGrid — session-relative, not epoch-relative', () => {
  // The epoch test this replaces (`ms % intervalMs === 0`) rejected EVERY live
  // bar on 10m/30m/75m/125m/1h/2h/4h/1D, because NSE bars start at 09:15 IST
  // and that is not a multiple of those intervals from the Unix epoch.
  const open = (y: number, m: number, d: number) => ist(y, m, d) * 1000;

  it('accepts the 09:15 session-open bar on every timeframe', () => {
    for (const mins of [1, 2, 3, 4, 5, 10, 15, 30, 75, 125, 60, 120, 240]) {
      expect(isOnDisplayGrid(open(2026, 9, 3), mins * 60_000)).toBe(true);
    }
  });

  it('accepts subsequent bars measured from the open', () => {
    // 75m chart: 09:15, 10:30, 11:45, 13:00, 14:15 are the session's bars.
    for (const [hh, mm] of [
      [10, 30],
      [11, 45],
      [13, 0],
      [14, 15],
    ]) {
      expect(isOnDisplayGrid(ist(2026, 9, 3, hh, mm) * 1000, 75 * 60_000)).toBe(true);
    }
  });

  it('rejects an intra-bar sample that is not on the display grid', () => {
    expect(isOnDisplayGrid(ist(2026, 9, 3, 10, 0) * 1000, 75 * 60_000)).toBe(false);
    expect(isOnDisplayGrid(ist(2026, 9, 3, 9, 20) * 1000, 10 * 60_000)).toBe(false);
  });

  it('treats any in-session timestamp as valid for daily-and-above', () => {
    expect(isOnDisplayGrid(ist(2026, 9, 3, 11, 7) * 1000, 86_400_000)).toBe(true);
    // ...but not one outside trading hours.
    expect(isOnDisplayGrid(ist(2026, 9, 3, 3, 0) * 1000, 86_400_000)).toBe(false);
  });
});
