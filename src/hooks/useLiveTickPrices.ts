// hooks/useLiveTickPrices.ts — derive latest tick price per symbol from the
// Alpha WebSocket candle stream.
//
// `ohlcCandles` is a flat time-series array (up to 3000 entries). A naive
// `arr.find()` per symbol per render is O(N×M); this hook builds the map once
// per store write (~every 16ms animation frame) and shares the reference across
// all consumers. The selector returns a stable ref when the underlying prices
// haven't changed, so React skips re-renders when the tick is for a different
// symbol than the ones the caller cares about.

import { useRef, useMemo } from 'react';
import { useTradeStore } from '../store/useTradeStore';

export interface LiveTick {
  /** Most recent tick price (candle close). */
  price: number;
  /** Candle timestamp — lets callers distinguish stale from fresh. */
  ts: number;
}

/**
 * Returns a `Map<symbol, LiveTick>` built from the latest candle per symbol in
 * `ohlcCandles`. Updates tick-by-tick (~16ms coalesced batches).
 *
 * Usage in the watchlist:
 * ```ts
 * const ticks = useLiveTickPrices();
 * const live = ticks.get('RELIANCE');  // { price: 2845.30, ts: 1725... }
 * ```
 */
export function useLiveTickPrices(): Map<string, LiveTick> {
  const candles = useTradeStore((s) => s.ohlcCandles);

  // Track the previous result so we can return a stable reference when nothing
  // the caller can observe actually changed.
  const prevRef = useRef<Map<string, LiveTick>>(new Map());

  return useMemo(() => {
    const next = new Map<string, LiveTick>();
    // Walk forward: later entries overwrite earlier ones, so we end up with the
    // latest candle per symbol.
    for (const c of candles) {
      const existing = next.get(c.symbol);
      if (!existing || c.start_timestamp_ms > existing.ts) {
        next.set(c.symbol, { price: c.close, ts: c.start_timestamp_ms });
      }
    }
    // Shallow equality check: skip a new object when prices haven't moved.
    const prev = prevRef.current;
    if (prev.size === next.size) {
      let same = true;
      for (const [sym, tick] of next) {
        const old = prev.get(sym);
        if (!old || old.price !== tick.price || old.ts !== tick.ts) {
          same = false;
          break;
        }
      }
      if (same) return prev;
    }
    prevRef.current = next;
    return next;
  }, [candles]);
}
