'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTradeStore } from '../../store/useTradeStore';
import { useChartUIStore, type PaneId } from '../../store/useChartUIStore';
import { createDatafeed } from '../../charting/datafeed';
import { markOnce } from '../../lib/perfMarks';
import { useGhostLine } from '../../hooks/useGhostLine';
import type { IChartingLibraryWidget } from '../../charting/datafeedTypes';
import {
  TIMEFRAME_TO_RESOLUTION,
  RESOLUTION_TO_TIMEFRAME,
  applyChartTheme,
} from '../../utils/tvThemeOverrides';
import { useTradingViewScript } from '../../hooks/useTradingViewScript';
import { getTvWidgetOptions } from '../../utils/tvWidgetOptions';
import { AlertTriangle } from 'lucide-react';
import { whenChartReady, whenHeaderReady } from '../../charting/widgetReady';
import { syncButtonStates } from '../../utils/tvWidgetSync';
import { registerTvToolbarButtons } from '../../utils/tvToolbarButtons';
import { registerChartWidget, unregisterChartWidget, handleLineToolChange } from '../../utils/tvDrawingToolSync';
import { ChartLayoutDropdown } from './ChartLayoutDropdown';
import { useTradingViewPaneFocus } from '../../hooks/useTradingViewPaneFocus';
import { useTradingViewWidgetSync } from '../../hooks/useTradingViewWidgetSync';

export interface TradingViewWidgetProps {
  symbolOverride?: string;
  timeframeOverride?: string;
  className?: string;
  isSplitPane?: boolean;
  hideLeftToolbar?: boolean;
  hideTimeframesToolbar?: boolean;
}

export default function TradingViewWidget({
  symbolOverride,
  timeframeOverride,
  className = '',
  isSplitPane = false,
  hideLeftToolbar = false,
  hideTimeframesToolbar = false,
}: TradingViewWidgetProps): React.JSX.Element {
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
  const activeLayout = useChartUIStore((s) => s.activeLayout);
  const layoutSync = useChartUIStore((s) => s.layoutSync);
  const setLayout = useChartUIStore((s) => s.setLayout);
  const setLayoutSync = useChartUIStore((s) => s.setLayoutSync);
  const [layoutAnchor, setLayoutAnchor] = useState<{ top: number; left: number } | null>(null);
  const layoutPickerRef = useRef<HTMLDivElement>(null);

  const activeSymbol = useMemo(() => {
    if (symbolOverride) return symbolOverride.toUpperCase();
    if (selectedSymbol) return selectedSymbol.toUpperCase();
    return (activeDecision ?? liveDecisions[liveDecisions.length - 1])?.symbol ?? 'RELIANCE';
  }, [symbolOverride, selectedSymbol, activeDecision, liveDecisions]);

  const effectiveTimeframe = timeframeOverride ?? activeTimeframe ?? '15m';
  const resolution = TIMEFRAME_TO_RESOLUTION[effectiveTimeframe] ?? '15';
  const { ready: scriptReady, error: scriptError } = useTradingViewScript();
  const [widgetError, setWidgetError] = useState<string | null>(null);

  // Close layout picker on outside clicks (inside iframe or parent window)
  useEffect(() => {
    if (!layoutAnchor) return;
    const handleOutside = (e: MouseEvent) => {
      if (layoutPickerRef.current && !layoutPickerRef.current.contains(e.target as Node)) {
        setLayoutAnchor(null);
      }
    };
    const iframe = containerRef.current?.querySelector('iframe');
    const doc = iframe?.contentDocument;
    document.addEventListener('mousedown', handleOutside);
    doc?.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      doc?.removeEventListener('mousedown', handleOutside);
    };
  }, [layoutAnchor]);

  // Pane Focus & Mouse Activation for Split Pane Selection
  useTradingViewPaneFocus(containerRef, hideLeftToolbar, scriptReady, scriptError);

  // Widget Initialization & Button Injection
  useEffect(() => {
    if (!scriptReady || !containerRef.current) return;
    if (!window.TradingView) {
      console.error('[TradingViewWidget] scriptReady=true but window.TradingView is undefined');
      setWidgetError('TradingView library loaded but widget constructor not found on window');
      return;
    }
    if (!activeSymbol) return;
    setWidgetError(null);

    const widgetOptions = getTvWidgetOptions({
      container: containerRef.current,
      datafeed: datafeedRef.current,
      activeSymbol,
      resolution,
      theme,
      isSplitPane,
      hideLeftToolbar,
      hideTimeframesToolbar,
    });

    try {
      const tvWidget = new window.TradingView.widget(widgetOptions);
      widgetRef.current = tvWidget;
      setWidgetState(tvWidget);

      whenChartReady(tvWidget, () => {
        markOnce('widget-ready');
        applyChartTheme(tvWidget, useChartUIStore.getState().theme);

        // Listen to symbol changes from TV search box
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

        // Listen to timeframe changes from TV interval dropdown
        try {
          const chartApi = tvWidget.activeChart() as any;
          chartApi.onIntervalChanged().subscribe(null, (interval: string) => {
            const tf = RESOLUTION_TO_TIMEFRAME[interval];
            if (tf) {
              const paneEl = containerRef.current?.closest('[data-pane-id]');
              if (paneEl) {
                const paneId = paneEl.getAttribute('data-pane-id') as PaneId;
                if (paneId) {
                  useChartUIStore.getState().setActivePane(paneId);
                  useChartUIStore.getState().setPaneTimeframe(paneId, tf);
                }
              }
              if (useTradeStore.getState().activeTimeframe !== tf) {
                useTradeStore.getState().setActiveTimeframe(tf);
              }
            }
          });
        } catch (err) {
          console.warn('[TradingViewWidget] Failed to subscribe to onIntervalChanged:', err);
        }

        const paneEl = containerRef.current?.closest('[data-pane-id]');
        const currentPaneId = paneEl ? (paneEl.getAttribute('data-pane-id') as PaneId) : 'main';
        if (currentPaneId) {
          registerChartWidget(currentPaneId, tvWidget);
        }

        try {
          (tvWidget as any).subscribe?.('onSelectedLineToolChanged', () => {
            handleLineToolChange(tvWidget);
          });
        } catch { }

        // Always register toolbar buttons in the header widget (both single and split views)
        whenHeaderReady(
          tvWidget,
          () => {
            const iframe = containerRef.current?.querySelector('iframe');
            const doc = iframe?.contentDocument;
            if (!doc) return;

            try {
              registerTvToolbarButtons(
                tvWidget,
                doc,
                {
                  onToggleLayoutPicker: (anchor) => {
                    setLayoutAnchor((prev) => (prev ? null : anchor));
                  },
                },
                isSplitPane
              );
              setButtonsCreated(true);
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
      const paneEl = containerRef.current?.closest('[data-pane-id]');
      const currentPaneId = paneEl ? (paneEl.getAttribute('data-pane-id') as PaneId) : 'main';
      if (currentPaneId) {
        unregisterChartWidget(currentPaneId);
      }
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch { }
        widgetRef.current = null;
        setWidgetState(null);
        setButtonsCreated(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady]);

  // Keep widget in sync with symbol, resolution, theme, and iframe buttons
  useTradingViewWidgetSync({
    containerRef,
    widgetRef,
    activeSymbol,
    resolution,
    theme,
    buttonsCreated,
  });
  // Ghostline engine is active ONLY in single chart view
  useGhostLine(isSplitPane ? null : widgetState, activeSymbol, effectiveTimeframe);
  const displayError = scriptError || widgetError;

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden flex flex-col bg-chart-bg">
      {/* Loading state */}
      {!scriptReady && !displayError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-chart-bg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-text-muted">Loading chart engine…</span>
        </div>
      )}
      {/* Error state */}
      {displayError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-chart-bg px-6 text-center">
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
      {layoutAnchor && (
        <div
          ref={layoutPickerRef}
          style={{ top: layoutAnchor.top, left: layoutAnchor.left }}
          className="absolute z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <ChartLayoutDropdown
            activeLayout={activeLayout}
            syncSettings={layoutSync}
            onSelectLayout={(id) => {
              setLayout(id);
              setLayoutAnchor(null);
              const iframe = containerRef.current?.querySelector('iframe');
              if (iframe?.contentDocument) {
                syncButtonStates(iframe.contentDocument);
              }
            }}
            onToggleSync={setLayoutSync}
          />
        </div>
      )}
    </div>
  );
}
