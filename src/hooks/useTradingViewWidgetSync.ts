'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { IChartingLibraryWidget } from '../charting/datafeedTypes';
import { invalidateScrollBackCache, prefetchHistory } from '../charting/datafeed';
import { whenChartReady } from '../charting/widgetReady';
import { applyChartTheme } from '../utils/tvThemeOverrides';
import { syncButtonStates } from '../utils/tvWidgetSync';
import { useChartUIStore } from '../store/useChartUIStore';

interface UseTradingViewWidgetSyncProps {
  containerRef: RefObject<HTMLDivElement | null>;
  widgetRef: RefObject<IChartingLibraryWidget | null>;
  activeSymbol: string;
  resolution: string;
  theme: 'light' | 'dark';
  buttonsCreated: boolean;
}

/**
 * useTradingViewWidgetSync — keeps the TradingView widget instance in sync with
 * activeSymbol, resolution, theme, and layout state.
 */
export function useTradingViewWidgetSync({
  containerRef,
  widgetRef,
  activeSymbol,
  resolution,
  theme,
  buttonsCreated,
}: UseTradingViewWidgetSyncProps): void {
  const ghostLineMode = useChartUIStore((s) => s.ghostLineMode);
  const splitView = useChartUIStore((s) => s.splitView);
  const sidebarOpen = useChartUIStore((s) => s.sidebarOpen);

  // Sync symbol changes: warm the history cache while TV is downloading/booting
  useEffect(() => {
    if (activeSymbol) prefetchHistory(activeSymbol, resolution);
  }, [activeSymbol, resolution]);

  const prevSymbolRef = useRef(activeSymbol);
  const prevResolutionRef = useRef(resolution);
  useEffect(() => {
    if (!activeSymbol) return;
    if (prevSymbolRef.current === activeSymbol) return;
    prevSymbolRef.current = activeSymbol;
    invalidateScrollBackCache(activeSymbol);

    const widget = widgetRef.current;
    if (!widget) return;

    const sym = activeSymbol.toUpperCase();
    const isFno =
      sym.endsWith('FUT') || ((sym.endsWith('CE') || sym.endsWith('PE')) && /\d/.test(sym));
    const exchange = isFno ? 'NFO' : 'NSE';
    const ticker = `${exchange}:${sym}`;

    whenChartReady(
      widget,
      () => {
        const chart = widget.activeChart() as {
          setSymbol: (s: string) => void;
          setResolution?: (r: string) => void;
        };
        chart.setSymbol(ticker);
        if (prevResolutionRef.current !== resolution) {
          prevResolutionRef.current = resolution;
          chart.setResolution?.(resolution);
        }
      },
      () => widgetRef.current !== widget,
      'TradingViewWidget'
    );
  }, [activeSymbol, resolution, widgetRef]);

  // Sync timeframe changes
  useEffect(() => {
    if (prevResolutionRef.current === resolution) return;
    prevResolutionRef.current = resolution;
    const widget = widgetRef.current;
    if (!widget) return;
    whenChartReady(
      widget,
      () => widget.activeChart().setResolution(resolution),
      () => widgetRef.current !== widget,
      'TradingViewWidget'
    );
  }, [resolution, widgetRef]);

  // Sync theme changes
  useEffect(() => {
    const doc = containerRef.current?.querySelector('iframe')?.contentDocument;
    if (doc) {
      syncButtonStates(doc);
    }
    const widget = widgetRef.current;
    if (!widget) return;
    whenChartReady(
      widget,
      () =>
        applyChartTheme(widget, theme, () => {
          const docAfter = containerRef.current?.querySelector('iframe')?.contentDocument;
          if (docAfter) {
            syncButtonStates(docAfter);
          }
        }),
      () => widgetRef.current !== widget,
      'TradingViewWidget'
    );
  }, [theme, containerRef, widgetRef]);

  // React state synchronization to iframe buttons
  useEffect(() => {
    const doc = containerRef.current?.querySelector('iframe')?.contentDocument;
    if (doc && buttonsCreated) {
      syncButtonStates(doc);
    }
  }, [ghostLineMode, splitView, sidebarOpen, buttonsCreated, theme, containerRef]);

  // ResizeObserver to trigger window resize so TradingView autosizes accurately on layout changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 50);
        }
      }
    });

    observer.observe(el);
    return () => {
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [containerRef]);
}

