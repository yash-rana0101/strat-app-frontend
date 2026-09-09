import type { IChartingLibraryWidget } from '../charting/datafeedTypes';
import { useFeatureStore } from '../store/useFeatureStore';
import { useTradeStore } from '../store/useTradeStore';
import { useChartUIStore } from '../store/useChartUIStore';
import { showIframeDropdown } from './iframeDropdown';
import { syncButtonStates } from './tvWidgetSync';
import { openExternalUrl, dashboardUrl } from '../lib/redirect';

export interface ToolbarButtonHandlers {
  onToggleLayoutPicker: (anchor: { top: number; left: number }) => void;
}

interface TvWidgetWithButton {
  createButton: () => HTMLElement;
}

export function registerTvToolbarButtons(
  tvWidget: TvWidgetWithButton,
  tvWidget: IChartingLibraryWidget,
  doc: Document,
  handlers: ToolbarButtonHandlers
): void {
  const createButton = tvWidget.createButton?.bind(tvWidget);
  if (typeof createButton !== 'function') return;

  const ghostlineEnabled = useFeatureStore.getState().access.ghostline;

  // 1. Ghost Line Button
  const ghostLineBtn = tvWidget.createButton();
  const ghostLineBtn = createButton();
  ghostLineBtn.id = 'tv-btn-ghost-line';
  ghostLineBtn.className = 'tv-custom-toolbar-btn';
  ghostLineBtn.title = ghostlineEnabled
    ? 'Ghost Line Engine'
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
        { value: 'linear' as const, label: 'OLS', description: 'Linear regression baseline' },
        { value: 'volume' as const, label: 'VWLR', description: 'Volume-weighted linear regression' },
        { value: 'curved' as const, label: 'VWEPR', description: 'Volume-weighted polynomial' },
        { value: 'forecast' as const, label: 'FCST', description: 'Volatility-aware forecaster' },
      ],
      currentMode,
      (v) => {
        useChartUIStore.getState().setGhostLineMode(v);
        syncButtonStates(doc);
      },
      doc
    );
  });

  // 2. Split View / Layout Selector Button
  const activeProfile = useTradeStore.getState().activeProfile;
  if (activeProfile === 'INTRADAY' || activeProfile === 'FNO') {
    const splitBtn = tvWidget.createButton();
    const splitBtn = createButton();
    splitBtn.id = 'tv-btn-split-view';
    splitBtn.className = 'tv-custom-toolbar-btn';
    splitBtn.title = 'Select Layout';
    splitBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      const rect = splitBtn.getBoundingClientRect();
      handlers.onToggleLayoutPicker({
        top: rect.bottom + 6,
        left: Math.max(10, rect.left - 120),
      });
    });
  }

  syncButtonStates(doc);
}
