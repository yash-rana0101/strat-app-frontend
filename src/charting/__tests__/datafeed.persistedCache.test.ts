// @vitest-environment jsdom
//
// Why a page refresh took seconds before the first bar rendered.
//
// The scroll-back cache was memory-only, so every reload started cold and
// re-paged TradingView's whole opening window through Kite. Now the last run
// per SYMBOL::TIMEFRAME is persisted to localStorage and `getBars` fetches
// only the edge of the window the cache is missing:
//   * a persisted run covers the HEAD and is stale at the TAIL -> one tail request;
//   * a window the cache fully covers -> no request at all.
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL ||= 'http://127.0.0.1:0/api/v1';
  process.env.NEXT_PUBLIC_DASHBOARD_URL ||= 'http://127.0.0.1:0/dashboard';
  process.env.NEXT_PUBLIC_AUTH_URL ||= 'https://auth.test.invalid';
});

const { kiteFetchSpy } = vi.hoisted(() => ({ kiteFetchSpy: vi.fn() }));
vi.mock('@/lib/kiteFetch', () => ({ kiteFetch: kiteFetchSpy }));

import { createDatafeed } from '@/charting/datafeed';
import type { LibrarySymbolInfo, ResolutionString } from '@/charting/datafeedTypes';

const MIN = 60_000;
const YESTERDAY_0400 = Date.UTC(2026, 8, 3, 4, 0); // 2026-09-03T04:00Z
const TODAY_0400_SEC = Date.UTC(2026, 8, 4, 4, 0) / 1000;

function getBars(fromMs: number, toMs: number) {
  return new Promise<{ time: number }[]>((resolve, reject) => {
    void createDatafeed().getBars(
      { name: 'TCS', exchange: 'NSE' } as LibrarySymbolInfo,
      '1' as ResolutionString,
      { from: fromMs / 1000, to: toMs / 1000, countBack: 0, firstDataRequest: true },
      (bars) => resolve(bars),
      reject,
    );
  });
}

describe('getBars over a persisted scroll-back cache', () => {
  beforeEach(() => {
    kiteFetchSpy.mockReset();
    kiteFetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        candles: [{ time: TODAY_0400_SEC, open: 100, high: 101, low: 99, close: 100, volume: 5 }],
      }),
    } as unknown as Response);

    // Sixty 1m bars from a previous session, as `schedulePersist` writes them.
    const rows = Array.from({ length: 60 }, (_, i) => [YESTERDAY_0400 + i * MIN, 100, 101, 99, 100, 1]);
    localStorage.setItem('stratai.bars.TCS::1m', JSON.stringify(rows));
  });

  it('fetches only the tail since the persisted run and merges it', async () => {
    const bars = await getBars(YESTERDAY_0400, TODAY_0400_SEC * 1000 + 30 * MIN);

    expect(kiteFetchSpy).toHaveBeenCalledTimes(1);
    const url = String(kiteFetchSpy.mock.calls[0][0]);
    expect(url).toContain('from=2026-09-03'); // from the newest cached bar, not the window start
    expect(url).toContain('to=2026-09-04');
    expect(bars).toHaveLength(61);
    expect(bars[bars.length - 1].time).toBe(TODAY_0400_SEC * 1000);
  });

  it('answers a fully covered window from memory without a network call', async () => {
    const bars = await getBars(YESTERDAY_0400, YESTERDAY_0400 + 59 * MIN + 30_000);

    expect(kiteFetchSpy).not.toHaveBeenCalled();
    expect(bars).toHaveLength(60);
  });
});