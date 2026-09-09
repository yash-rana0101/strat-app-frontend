'use client';

import { useEffect, useState, useRef } from 'react';
import { bridgeListen } from '../../lib/bridge';
import { istToday } from '../../lib/bridge/fnoWeb';
import { kiteFetch } from '../../lib/kiteFetch';
import {
  type OrderBookState,
  type IndexFutureExchange,
  type KiteFutureInstrument,
  createEmptyBook,
  buildBookFromDepth,
  buildBookFromKiteDepth,
  indexFutureSpec,
  parseCachedBook,
  selectNearestLiveFuture,
  BOOK_CACHE_VERSION,
} from './orderBookHelpers';
import type { MarketDepthStatsData } from './marketDepthTypes';

/** Depth refresh cadence. Kite allows ~3 req/s and the watchlist shares it. */
const DEPTH_POLL_MS = 2000;

/** Per-request ceiling for a depth fetch. */
const DEPTH_REQUEST_TIMEOUT_MS = 1800;

/** Instrument-master lookups are larger than quote responses, so give them room. */
const DEPTH_SOURCE_REQUEST_TIMEOUT_MS = 8000;

/** Write the cache at most this often; the poll itself runs every 2s. */
const CACHE_WRITE_MIN_INTERVAL_MS = 10_000;

const cacheKey = (symbol: string) =>
  `ai-trader-orderbook-${BOOK_CACHE_VERSION}-${symbol.toUpperCase()}`;

const statsCacheKey = (symbol: string) => `ai-trader-orderbook-stats-${symbol.toUpperCase()}`;

interface IndexDepthSource {
  forSymbol: string;
  symbol: string;
  exchange: IndexFutureExchange;
}

export type IndexDepthMode = 'native' | 'resolving' | 'future' | 'unavailable';

export function useOrderBookData(selectedSymbol: string) {
  const [book, setBook] = useState<OrderBookState>(() => createEmptyBook());
  const [isLive, setIsLive] = useState(false);
  const [stats, setStats] = useState<MarketDepthStatsData | null>(null);
  const [depthSource, setDepthSource] = useState<IndexDepthSource | null>(null);
  const [indexDepthMode, setIndexDepthMode] = useState<IndexDepthMode>(() =>
    indexFutureSpec(selectedSymbol) ? 'resolving' : 'native'
  );
  const updateCountRef = useRef(0);

  const normalizedSelectedSymbol = selectedSymbol.trim().toUpperCase();
  const activeDepthSource =
    depthSource?.forSymbol === normalizedSelectedSymbol ? depthSource : null;

  // ── Load cached order book and stats when symbol changes ──────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let cached: string | null = null;
      // A spot index's ladder comes from its current near-month future. Do not
      // restore that book under the index name after the contract has rolled.
      if (!indexFutureSpec(selectedSymbol)) {
        try {
          cached = localStorage.getItem(cacheKey(selectedSymbol));
        } catch {
          cached = null;
        }
      }
      const restored = parseCachedBook(cached);
      if (restored) {
        setBook(restored);
        setIsLive(false);
      } else {
        setBook(createEmptyBook());
        setIsLive(false);
      }

      try {
        const cachedStats = localStorage.getItem(statsCacheKey(selectedSymbol));
        if (cachedStats) {
          setStats(JSON.parse(cachedStats));
        } else {
          setStats(null);
        }
      } catch {
        setStats(null);
      }
      return;
    }
    setBook(createEmptyBook());
    setIsLive(false);
    setStats(null);
  }, [selectedSymbol]);

  // ── Resolve a tradable depth source for calculated spot indices ───────────
  useEffect(() => {
    const spec = indexFutureSpec(selectedSymbol);
    setDepthSource(null);

    if (!spec) {
      setIndexDepthMode('native');
      return;
    }

    setIndexDepthMode('resolving');
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEPTH_SOURCE_REQUEST_TIMEOUT_MS);

    const resolve = async () => {
      try {
        const query = encodeURIComponent(`${spec.underlying} FUT`);
        const res = await kiteFetch(`/instruments?q=${query}&exchange=${spec.exchange}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`instrument lookup HTTP ${res.status}`);

        const data = (await res.json()) as { results?: KiteFutureInstrument[] };
        const future = selectNearestLiveFuture(data.results ?? [], spec, istToday());
        if (cancelled) return;

        if (future) {
          setDepthSource({
            forSymbol: selectedSymbol.trim().toUpperCase(),
            symbol: future.tradingsymbol,
            exchange: spec.exchange,
          });
          setIndexDepthMode('future');
        } else {
          setIndexDepthMode('unavailable');
        }
      } catch (err) {
        if (!cancelled) {
          setIndexDepthMode('unavailable');
          console.warn(
            `[OrderBook] Could not resolve a live future for ${selectedSymbol}:`,
            err instanceof Error ? err.message : String(err)
          );
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    void resolve();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [selectedSymbol]);

  // ── Listen for real-time order book data from backend IPC ──────────
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setupListener() {
      try {
        const unlisten = await bridgeListen<{
          bid_prices: number[];
          bid_sizes: number[];
          ask_prices: number[];
          ask_sizes: number[];
        }>('orderbook-update', (event) => {
          const { bid_prices, bid_sizes, ask_prices, ask_sizes } = event.payload;
          const newBook = buildBookFromDepth(bid_prices, bid_sizes, ask_prices, ask_sizes);
          setBook(newBook);
          setIsLive(true);
          updateCountRef.current += 1;

          if (updateCountRef.current % 5 === 0 && !indexFutureSpec(selectedSymbol)) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(cacheKey(selectedSymbol), JSON.stringify(newBook));
            }
          }
        });
        cleanup = unlisten;
      } catch {
        console.info('[OrderBook] Tauri IPC unavailable — order book is in cold standby.');
      }
    }

    setupListener();
    return () => {
      cleanup?.();
    };
  }, [selectedSymbol]);

  // ── Poll Kite REST depth and quote statistics ────────────────────────
  useEffect(() => {
    const symbol = selectedSymbol?.trim();
    if (!symbol) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastCacheWrite = 0;

    const tick = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEPTH_REQUEST_TIMEOUT_MS);
      try {
        const indexSpec = indexFutureSpec(symbol);
        const isFno =
          symbol.endsWith('FUT') ||
          ((symbol.endsWith('CE') || symbol.endsWith('PE')) && /\d/.test(symbol));
        const exchange = indexSpec?.spotExchange ?? (isFno ? 'NFO' : 'NSE');

        const quoteParams = [`i=${exchange}:${encodeURIComponent(symbol)}`];
        if (activeDepthSource) {
          quoteParams.push(
            `i=${activeDepthSource.exchange}:${encodeURIComponent(activeDepthSource.symbol)}`
          );
        }

        const res = await kiteFetch(`/quote?${quoteParams.join('&')}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`quote HTTP ${res.status}`);
        const data = await res.json();
        const quotes = Array.isArray(data?.quotes) ? data.quotes : [];
        const findQuote = (target: string) =>
          quotes.find(
            (q: { symbol?: string }) => q?.symbol?.toUpperCase() === target.toUpperCase()
          );
        const quote = findQuote(symbol) ?? (!activeDepthSource ? quotes[0] : undefined);
        const depthQuote = activeDepthSource ? findQuote(activeDepthSource.symbol) : quote;

        if (quote) {
          const newStats: MarketDepthStatsData = {
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close,
            last_price: quote.last_price,
            volume: quote.volume,
            average_price: quote.average_price,
            lower_circuit_limit: quote.lower_circuit_limit,
            upper_circuit_limit: quote.upper_circuit_limit,
            last_quantity: quote.last_quantity,
            last_trade_time: quote.last_trade_time,
          };
          setStats(newStats);

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(statsCacheKey(symbol), JSON.stringify(newStats));
            } catch {}
          }
        }

        const next = buildBookFromKiteDepth(depthQuote?.depth);
        if (cancelled) return;

        if (next) {
          setBook(next);
          setIsLive(true);

          const now = Date.now();
          if (
            typeof window !== 'undefined' &&
            !indexSpec &&
            now - lastCacheWrite >= CACHE_WRITE_MIN_INTERVAL_MS
          ) {
            lastCacheWrite = now;
            try {
              localStorage.setItem(cacheKey(symbol), JSON.stringify(next));
            } catch {}
          }
        } else {
          // Broker returned depth with no active orders (market closed / off-hours)
          setBook(createEmptyBook());
          setIsLive(false);
        }
      } catch {
        if (!cancelled) setIsLive(false);
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) timer = setTimeout(tick, DEPTH_POLL_MS);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [selectedSymbol, activeDepthSource]);

  return {
    book,
    isLive,
    stats,
    depthSourceSymbol: activeDepthSource?.symbol ?? null,
    indexDepthMode,
  };
}
