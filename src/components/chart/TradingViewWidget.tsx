'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useTradeStore } from '../../store/useTradeStore';
import { useChartUIStore, type PaneId } from '../../store/useChartUIStore';
import { useFeature, useFeatureStore } from '../../store/useFeatureStore';
import {
  createDatafeed,
  invalidateScrollBackCache,
  prefetchHistory,
} from '../../charting/datafeed';
import { markOnce } from '../../lib/perfMarks';
import { useGhostLine } from '../../hooks/useGhostLine';
import type { IChartingLibraryWidget } from '../../charting/datafeedTypes';
import { TIMEFRAME_TO_RESOLUTION, getThemeOverrides, applyChartTheme } from '../../utils/tvThemeOverrides';
import { useTradingViewScript } from '../../hooks/useTradingViewScript';
import { getTvWidgetOptions } from '../../utils/tvWidgetOptions';
import { AlertTriangle } from 'lucide-react';
import { showIframeDropdown } from '../../utils/iframeDropdown';
import { whenChartReady, whenHeaderReady } from '../../charting/widgetReady';
import { syncButtonStates } from '../../utils/tvWidgetSync';
import { openExternalUrl, dashboardUrl } from '../../lib/redirect';

export interface TradingViewWidgetProps {
  symbolOverride?: string;
  timeframeOverride?: string;
  className?: string;
}

export default function TradingViewWidget({
  symbolOverride,
  timeframeOverride,
  className = '',
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<IChartingLibraryWidget | null>(null);
  const [widgetState, setWidgetState] = useState<IChartingLibraryWidget | null>(null);
  const [buttonsCreated, setButtonsCreated] = useState(false);
  const datafeedRef = useRef(createDatafeed());

  const selectedSymbol = useTradeStore((s) => s.selectedSymbol);
  const activeDecision = useTradeStore((s) => s.activeDecision);
  const liveDecisions = useTradeStore((s) => s.liveDecisions);
  const activeTimeframe = useTradeStore((s) => s.activeTimeframe);

  const theme = useChartUIStore((s) => s.theme);
  const isFullscreen = useChartUIStore((s) => s.isFullscreen);
  const sidebarOpen = useChartUIStore((s) => s.sidebarOpen);
  const ghostLineMode = useChartUIStore((s) => s.ghostLineMode);
  const splitView = useChartUIStore((s) => s.splitView);
  const ghostlineEnabled = useFeature('ghostline');

  const activeSymbol = useMemo(() => {
    if (symbolOverride) return symbolOverride.toUpperCase();
    if (selectedSymbol) return selectedSymbol.toUpperCase();
    return (activeDecision ?? liveDecisions[liveDecisions.length - 1])?.symbol ?? 'RELIANCE';
  }, [symbolOverride, selectedSymbol, activeDecision, liveDecisions]);

  const effectiveTimeframe = timeframeOverride ?? activeTimeframe ?? '15m';
  const resolution = TIMEFRAME_TO_RESOLUTION[effectiveTimeframe] ?? '15';
  const { ready: scriptReady, error: scriptError } = useTradingViewScript();
  const [widgetError, setWidgetError] = useState<string | null>(null);

  // ── Iframe Focus & Mouse Activation for Split Pane Selection ──────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePaneActivate = () => {
      const paneEl = container.closest('[data-pane-id]');
      if (paneEl) {
        const paneId = paneEl.getAttribute('data-pane-id') as PaneId;
        if (paneId && useChartUIStore.getState().activePaneId !== paneId) {
          useChartUIStore.getState().setActivePane(paneId);
        }
      }
    };

    container.addEventListener('mousedown', handlePaneActivate, true);
    container.addEventListener('pointerdown', handlePaneActivate, true);
    container.addEventListener('click', handlePaneActivate, true);

    const attachIframeListeners = () => {
      const iframe = container.querySelector('iframe');
      if (!iframe) return;
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          doc.addEventListener('mousedown', handlePaneActivate, true);
          doc.addEventListener('pointerdown', handlePaneActivate, true);
          doc.addEventListener('click', handlePaneActivate, true);
          if (doc.defaultView) {
            doc.defaultView.addEventListener('focus', handlePaneActivate, true);
          }
        }
      } catch { }
    };

    attachIframeListeners();

    const iframe = container.querySelector('iframe');
    if (iframe) {
      iframe.addEventListener('load', attachIframeListeners);
    }

    const intervalId = setInterval(attachIframeListeners, 500);

    return () => {
      clearInterval(intervalId);
      container.removeEventListener('mousedown', handlePaneActivate, true);
      container.removeEventListener('pointerdown', handlePaneActivate, true);
      container.removeEventListener('click', handlePaneActivate, true);
      if (iframe) {
        iframe.removeEventListener('load', attachIframeListeners);
        try {
          const doc = iframe.contentDocument;
          if (doc) {
            doc.removeEventListener('mousedown', handlePaneActivate, true);
            doc.removeEventListener('pointerdown', handlePaneActivate, true);
            doc.removeEventListener('click', handlePaneActivate, true);
          }
        } catch { }
      }
    };
  }, [scriptReady, scriptError]);

  // ── Widget Initialization & Button Injection ─────────────────────────
  useEffect(() => {
    if (!scriptReady || !containerRef.current) return;
    if (!window.TradingView) {
      console.error('[TradingViewWidget] scriptReady=true but window.TradingView is undefined');
      setWidgetError('TradingView library loaded but widget constructor not found on window');
      return;
    }
    // Don't mount the widget until we have a real symbol to chart; otherwise
    // the widget boots with an empty ticker and shows a loading state.
    if (!activeSymbol) return;
    setWidgetError(null);

    const widgetOptions = getTvWidgetOptions({
      container: containerRef.current,
      datafeed: datafeedRef.current,
      activeSymbol,
      resolution,
      theme,
    });

    try {
      const tvWidget = new window.TradingView.widget(widgetOptions);
      widgetRef.current = tvWidget;
      setWidgetState(tvWidget);

      whenChartReady(tvWidget, () => {
        markOnce('widget-ready');
        // Reconcile the theme now that the chart exists.
        //
        // TradingView restores its own saved chart properties from
        // localStorage (`save_chart_properties_to_local_storage` /
        // `load_last_chart`), which can carry the colours of whatever theme was
        // last used and override the `theme` we passed at construction. The
        // theme effect below only runs when `theme` CHANGES, so on a fresh load
        // nothing corrected those restored properties — the shell rendered dark
        // while the candles stayed light. Applying the overrides here makes the
        // chart match the store on every mount, not just on a toggle.
        applyChartTheme(tvWidget, useChartUIStore.getState().theme);

        // Listen to symbol changes from the TV search box
        try {
          const chartApi = tvWidget.activeChart() as any;
          chartApi.onSymbolChanged().subscribe(null, () => {
            const fullSymbol = chartApi.symbol();
            if (fullSymbol && fullSymbol !== '---') {
              const cleanSymbol = fullSymbol.includes(':') ? fullSymbol.split(':')[1] : fullSymbol;
              const paneEl = containerRef.current?.closest('[data-pane-id]');
              if (paneEl) {
                const paneId = paneEl.getAttribute('data-pane-id') as PaneId;
                if (paneId) {
                  useChartUIStore.getState().setActivePane(paneId);
                  useChartUIStore.getState().setPaneSymbol(paneId, cleanSymbol);
                }
              } else {
                const currentSymbol = useTradeStore.getState().selectedSymbol;
                if (currentSymbol !== cleanSymbol) {
                  useTradeStore.getState().setSelectedSymbol(cleanSymbol);
                }
              }
            }
          });
        } catch (err) {
          console.warn('[TradingViewWidget] Failed to subscribe to onSymbolChanged:', err);
        }

        whenHeaderReady(
          tvWidget,
          () => {
            const iframe = containerRef.current?.querySelector('iframe');
            const doc = iframe?.contentDocument;
            if (!doc) return;

            try {
              const ghostLineBtn = (tvWidget as any).createButton();
              ghostLineBtn.id = 'tv-btn-ghost-line';
              ghostLineBtn.className = 'tv-custom-toolbar-btn';
              ghostLineBtn.title = ghostlineEnabled
                ? 'Projection Engine'
                : 'Ghostline requires a subscription';
              ghostLineBtn.addEventListener('click', () => {
                if (!useFeatureStore.getState().access.ghostline) {
                  openExternalUrl(dashboardUrl());
                  return;
                }
                const currentMode = useChartUIStore.getState().ghostLineMode;
                showIframeDropdown(
                  ghostLineBtn,
                  [
                    {
                      value: 'linear' as const,
                      label: 'OLS',
                      description: 'Linear regression baseline',
                    },
                    {
                      value: 'volume' as const,
                      label: 'VWLR',
                      description: 'Volume-weighted linear regression',
                    },
                    {
                      value: 'curved' as const,
                      label: 'VWEPR',
                      description: 'Volume-weighted polynomial',
                    },
                    {
                      value: 'forecast' as const,
                      label: 'FCST',
                      description: 'Volatility-aware forecaster',
                    },
                  ],
                  currentMode,
                  (v) => {
                    useChartUIStore.getState().setGhostLineMode(v);
                    syncButtonStates(doc);
                  },
                  doc
                );
              });

              let splitViewBtn: HTMLElement | undefined;
              const activeProfile = useTradeStore.getState().activeProfile;
              if (activeProfile === 'INTRADAY' || activeProfile === 'FNO') {
                const btn = (tvWidget as any).createButton();
                btn.id = 'tv-btn-split-view';
                btn.className = 'tv-custom-toolbar-btn';
                btn.title = 'Chart Layout';
                btn.addEventListener('click', () => {
                  const currentVal = useChartUIStore.getState().splitView;
                  showIframeDropdown(
                    btn,
                    [
                      { value: false, label: 'Single Pane' },
                      { value: true, label: 'Split Pane' },
                    ],
                    currentVal,
                    (v) => {
                      useChartUIStore.getState().setSplitView(v);
                      syncButtonStates(doc);
                    },
                    doc
                  );
                });
                splitViewBtn = btn;
              }

              setButtonsCreated(true);
              syncButtonStates(doc);
            } catch (err) {
              console.error('[TradingViewWidget] Custom button registration failed:', err);
            }
          },
          () => !widgetRef.current,
          'ToolbarButtons'
        );
      });
    } catch (err) {
      console.error('[TradingViewWidget] Widget creation failed:', err);
      setWidgetError(`Widget creation failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch { }
        widgetRef.current = null;
        setWidgetState(null);
        setButtonsCreated(false);
      }
    };
    // NOTE: `activeSymbol` is deliberately NOT a dependency.
    //
    // It used to be, which meant every symbol change destroyed the widget
    // (`remove()`) and constructed a brand new one. Two bugs came out of that:
    //
    //  · The chart "reloaded" constantly. When no symbol is explicitly
    //    selected, `activeSymbol` falls back to the tail of the streaming
    //    `liveDecisions` array, so each incoming decision changed it and
    //    rebuilt the whole widget.
    //  · It opened the tear-down race behind the GhostLine TypeError:
    //    `remove()` runs synchronously in cleanup but `setWidgetState(null)`
    //    only lands on the next render, so dependent effects kept operating on
    //    a gutted widget.
    //
    // Symbol changes are already handled incrementally by the effect below via
    // `activeChart().setSymbol`, which is what the library wants anyway. The
    // widget is now built once per mount. `activeSymbol` is still read on the
    // first run to pick the initial ticker — that is intentional and correct,
    // since a later change is applied by the sync effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady]);

  // Sync symbol changes
  // Warm the history cache while the TV library is still downloading/booting
  // (this does not wait on scriptReady), so the first getBars is a memory read.
  useEffect(() => {
    if (activeSymbol) prefetchHistory(activeSymbol, resolution);
  }, [activeSymbol, resolution]);

  const prevSymbolRef = useRef(activeSymbol);
  const prevResolutionRef = useRef(resolution);
  useEffect(() => {
    if (!activeSymbol) return;
    if (prevSymbolRef.current === activeSymbol) return;
    prevSymbolRef.current = activeSymbol;
    // Drop the per-symbol scroll-back cache so the new symbol starts fresh
    // (TV will call getBars with its initial window immediately).
    invalidateScrollBackCache(activeSymbol);

    const widget = widgetRef.current;
    if (!widget) return;

    const sym = activeSymbol.toUpperCase();
    const isFno =
      sym.endsWith('FUT') || ((sym.endsWith('CE') || sym.endsWith('PE')) && /\d/.test(sym));
    const exchange = isFno ? 'NFO' : 'NSE';
    const ticker = `${exchange}:${sym}`;

    // `widget.setSymbol(...)` is deprecated in favour of
    // `widget.activeChart().setSymbol(...)` (and the deprecated overload also
    // requires a third `callback` argument that was never being passed). Go
    // through the chart API, and set the resolution separately — the chart-level
    // `setSymbol` takes only the ticker.
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
  }, [activeSymbol, resolution]);

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
  }, [resolution]);

  // Sync theme changes
  useEffect(() => {
    const doc = containerRef.current?.querySelector('iframe')?.contentDocument;
    if (doc) {
      syncButtonStates(doc);
    }
    const widget = widgetRef.current;
    if (!widget) return;
    // `applyChartTheme` chains the override re-apply off `changeTheme`'s promise
    // instead of guessing with a timeout — see its doc comment.
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
  }, [theme]);

  // React state synchronization to iframe buttons
  useEffect(() => {
    const doc = containerRef.current?.querySelector('iframe')?.contentDocument;
    if (doc && buttonsCreated) {
      syncButtonStates(doc);
    }
    // `chartMode` was a dependency here purely to re-render the removed button's
    // icon. Dropped with it — nothing in syncButtonStates reads it any more.
  }, [ghostLineMode, splitView, sidebarOpen, buttonsCreated, theme]);

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
  }, []);

  useGhostLine(widgetState, activeSymbol, effectiveTimeframe);

  const displayError = scriptError || widgetError;

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden flex flex-col bg-surface">
      {/* Loading state — script is still downloading */}
      {!scriptReady && !displayError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-text-muted">Loading chart engine…</span>
        </div>
      )}
      {/* Error state — script or widget failed */}
      {displayError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface px-6 text-center">
          <span className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
            <AlertTriangle size={14} className="shrink-0" />
            Chart failed to load
          </span>
          <span className="max-w-md text-[10px] text-text-muted">{displayError}</span>
        </div>
      )}
      <div
        ref={containerRef}
        data-tradingview-container="true"
        className={`relative flex-1 w-full h-full min-h-0 ${className}`}
        style={{ minHeight: '320px' }}
      />
    </div>
  );
}
