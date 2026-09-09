import type { ChartLayoutId, LayoutSyncSettings } from '../types/chartLayout';
import { DEFAULT_LAYOUT_SYNC, ALL_PANE_IDS } from '../types/chartLayout';
import type { ChartPaneState } from './useChartUIStore';

export interface SplitLayoutState {
  activeLayout: ChartLayoutId;
  layoutSync: LayoutSyncSettings;
  setLayout: (layoutId: ChartLayoutId) => void;
  setLayoutSync: (key: keyof LayoutSyncSettings, enabled: boolean) => void;
}

/**
 * Ensures the panes array contains exactly `targetCount` panes,
 * reusing existing pane configurations and seeding new panes with `seedSymbol`.
 */
export function ensurePanes(
  targetCount: number,
  existingPanes: ChartPaneState[],
  seedSymbol: string
): ChartPaneState[] {
  const count = Math.max(1, Math.min(targetCount, ALL_PANE_IDS.length));
  const result: ChartPaneState[] = [];

  for (let i = 0; i < count; i++) {
    const paneId = ALL_PANE_IDS[i];
    const existing = existingPanes[i] || existingPanes.find((p) => p.id === paneId);
    if (existing) {
      result.push({
        ...existing,
        id: paneId,
        symbol: existing.symbol || seedSymbol,
      });
    } else {
      result.push({
        id: paneId,
        symbol: seedSymbol,
        timeframe: existingPanes[0]?.timeframe || '10m',
        chartType: existingPanes[0]?.chartType || 'candlestick',
      });
    }
  }

  return result;
}

export const initialSplitLayoutState = {
  activeLayout: '1' as ChartLayoutId,
  layoutSync: { ...DEFAULT_LAYOUT_SYNC },
};
