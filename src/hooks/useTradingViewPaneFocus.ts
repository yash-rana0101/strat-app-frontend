'use client';

import { useEffect, type RefObject } from 'react';
import { useChartUIStore, type PaneId } from '../store/useChartUIStore';
import { syncToolToPane } from '../utils/tvDrawingToolSync';

/**
 * useTradingViewPaneFocus — manages pointer and iframe focus listeners
 * to activate the appropriate chart pane and sync drawing tools.
 */
export function useTradingViewPaneFocus(
  containerRef: RefObject<HTMLDivElement | null>,
  hideLeftToolbar: boolean,
  scriptReady: boolean,
  scriptError: string | null
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePaneActivate = (e?: Event) => {
      // If clicking inside the left drawing toolbar, do not switch active pane
      // so the secondary pane keeps its active status while selecting drawing tools!
      if (!hideLeftToolbar && e && e.target instanceof HTMLElement) {
        if (e.target.closest('.tv-side-toolbar, [class*="drawingToolbar"]')) {
          return;
        }
      }
      const paneEl = container.closest('[data-pane-id]');
      if (paneEl) {
        const paneId = paneEl.getAttribute('data-pane-id') as PaneId;
        if (paneId && useChartUIStore.getState().activePaneId !== paneId) {
          useChartUIStore.getState().setActivePane(paneId);
          syncToolToPane(paneId);
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
  }, [containerRef, hideLeftToolbar, scriptReady, scriptError]);
}

