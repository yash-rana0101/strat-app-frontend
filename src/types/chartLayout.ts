/**
 * Multi-chart layout types and synchronization options matching TradingView's
 * 1-to-8 pane arrangements and "Sync in Layout" controls.
 */

export type PaneId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export const ALL_PANE_IDS: PaneId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export type ChartLayoutId =
  // 1 Chart
  | '1'
  // 2 Charts
  | '2v'
  | '2h'
  // 3 Charts
  | '3v'
  | '3h'
  | '1-2'
  | '2-1'
  | '3s'
  | '3r'
  // 4 Charts
  | '4'
  | '4h'
  | '4v'
  | '1-3'
  | '3-1'
  | '1-3-h'
  | '3-1-h'
  | '2-2-l'
  | '2-2-r'
  | '2-2-h'
  // 5 Charts
  | '1-4-h'
  | '5v'
  | '5h'
  | '1-4'
  | '4-1'
  | '2-3'
  | '3-2'
  | '4-1-h'
  | '1-3-1'
  | '2-1-2'
  // 6 Charts
  | '6'
  | '6v'
  | '6h'
  | '6c'
  | '1-5'
  | '5-1'
  // 7 Charts
  | '1-6'
  | '7v'
  | '1-2-4'
  // 8 Charts
  | '8'
  | '8c'
  | '8v'
  | '8h';

export interface LayoutSyncSettings {
  symbol: boolean;
  interval: boolean;
  crosshair: boolean;
  time: boolean;
  dateRange: boolean;
}

export const DEFAULT_LAYOUT_SYNC: LayoutSyncSettings = {
  symbol: false,
  interval: false,
  crosshair: true,
  time: true,
  dateRange: false,
};

export interface LayoutDefinition {
  id: ChartLayoutId;
  name: string;
  paneCount: number;
  row: number; // 1 to 8
  /** Optional custom CSS grid template style for the split container */
  cssTemplate?: {
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    gridTemplateAreas?: string;
  };
}
