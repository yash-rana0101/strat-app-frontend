'use client';

import { useEffect, useState, useRef } from 'react';
import { bridgeListen } from '../../lib/bridge';
import { kiteFetch } from '../../lib/kiteFetch';
import {
  type OrderBookState,
  createEmptyBook,
  buildBookFromDepth,
  buildBookFromKiteDepth,
  parseCachedBook,
  BOOK_CACHE_VERSION,
} from './orderBookHelpers';
import type { MarketDepthStatsData } from './marketDepthTypes';

/** Depth refresh cadence. Kite allows ~3 req/s and the watchlist shares it. */
const DEPTH_POLL_MS = 2000;

/** Per-request ceiling for a depth fetch. */
const DEPTH_REQUEST_TIMEOUT_MS = 1800;

/** Write the cache at most this often; the poll itself runs every 2s. */
const CACHE_WRITE_MIN_INTERVAL_MS = 10_000;

const cacheKey = (symbol: string) =>
  `ai-trader-orderbook-${BOOK_CACHE_VERSION}-${symbol.toUpperCase()}`;

const statsCacheKey = (symbol: string) =>
  `ai-trader-orderbook-stats-${symbol.toUpperCase()}`;

export function useOrderBookData(selectedSymbol: string) {
  const [book, setBook] = useState<OrderBookState>(() => createEmptyBook());
  const [isLive, setIsLive] = useState(false);
  const [stats, setStats] = useState<MarketDepthStatsData | null>(null);
  const updateCountRef = useRef(0);

  // ── Load cached order book and stats when symbol changes ──────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let cached: string | null = null;
      try {
        cached = localStorage.getItem(cacheKey(selectedSymbol));
      } catch {
        cached = null;
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

          if (updateCountRef.current % 5 === 0) {
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
        const isFno =
          symbol.endsWith('FUT') ||
          ((symbol.endsWith('CE') || symbol.endsWith('PE')) && /\d/.test(symbol));
        const exchange = isFno ? 'NFO' : 'NSE';

        const res = await kiteFetch(`/quote?i=${exchange}:${encodeURIComponent(symbol)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`quote HTTP ${res.status}`);
        const data = await res.json();
        const quote =
          (data?.quotes ?? []).find(
            (q: { symbol?: string }) => q?.symbol?.toUpperCase() === symbol.toUpperCase(),
          ) ?? (data?.quotes ?? [])[0];

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

        const next = buildBookFromKiteDepth(quote?.depth);
        if (cancelled) return;

        if (next) {
          setBook(next);
          setIsLive(true);

          const now = Date.now();
          if (typeof window !== 'undefined' && now - lastCacheWrite >= CACHE_WRITE_MIN_INTERVAL_MS) {
            lastCacheWrite = now;
            try {
              localStorage.setItem(cacheKey(symbol), JSON.stringify(next));
            } catch {}
          }
        } else {
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
  }, [selectedSymbol]);

  return { book, isLive, stats };
}

