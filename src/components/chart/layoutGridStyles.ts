import type { ChartLayoutId } from '../../types/chartLayout';

interface GridConfig {
  containerClass: string;
  paneClasses?: Record<number, string>;
}

const LAYOUT_GRID_CONFIGS: Record<ChartLayoutId, GridConfig> = {
  '1': { containerClass: 'grid grid-cols-1 grid-rows-1' },

  // 2 Panes
  '2v': { containerClass: 'grid grid-cols-2 grid-rows-1 gap-1' },
  '2h': { containerClass: 'grid grid-cols-1 grid-rows-2 gap-1' },

  // 3 Panes
  '3v': { containerClass: 'grid grid-cols-3 grid-rows-1 gap-1' },
  '3h': { containerClass: 'grid grid-cols-1 grid-rows-3 gap-1' },
  '1-2': {
    containerClass: 'grid grid-cols-2 grid-rows-2 gap-1',
    paneClasses: { 0: 'row-span-2 col-span-1' },
  },
  '2-1': {
    containerClass: 'grid grid-cols-2 grid-rows-2 gap-1',
    paneClasses: { 2: 'row-span-2 col-span-1' },
  },
  '3s': {
    containerClass: 'grid grid-cols-2 grid-rows-2 gap-1',
    paneClasses: { 0: 'col-span-2 row-span-1' },
  },
  '3r': {
    containerClass: 'grid grid-cols-2 grid-rows-2 gap-1',
    paneClasses: { 2: 'col-span-2 row-span-1' },
  },

  // 4 Panes
  '4': { containerClass: 'grid grid-cols-2 grid-rows-2 gap-1' },
  '4h': { containerClass: 'grid grid-cols-1 grid-rows-4 gap-1' },
  '4v': { containerClass: 'grid grid-cols-4 grid-rows-1 gap-1' },
  '1-3': {
    containerClass: 'grid grid-cols-2 grid-rows-3 gap-1',
    paneClasses: { 0: 'row-span-3 col-span-1' },
  },
  '3-1': {
    containerClass: 'grid grid-cols-2 grid-rows-3 gap-1',
    paneClasses: { 3: 'row-span-3 col-span-1' },
  },
  '1-3-h': {
    containerClass: 'grid grid-cols-3 grid-rows-2 gap-1',
    paneClasses: { 0: 'col-span-3 row-span-1' },
  },
  '3-1-h': {
    containerClass: 'grid grid-cols-3 grid-rows-2 gap-1',
    paneClasses: { 3: 'col-span-3 row-span-1' },
  },
  '2-2-l': {
    containerClass: 'grid grid-cols-3 grid-rows-2 gap-1',
    paneClasses: { 0: 'row-span-2 col-span-1', 3: 'row-span-2 col-span-1' },
  },
  '2-2-r': {
    containerClass: 'grid grid-cols-2 grid-rows-2 gap-1',
  },
  '2-2-h': {
    containerClass: 'grid grid-cols-2 grid-rows-2 gap-1',
  },

  // 5 Panes
  '1-4-h': {
    containerClass: 'grid grid-cols-4 grid-rows-2 gap-1',
    paneClasses: { 0: 'col-span-4 row-span-1' },
  },
  '5v': { containerClass: 'grid grid-cols-5 grid-rows-1 gap-1' },
  '5h': { containerClass: 'grid grid-cols-1 grid-rows-5 gap-1' },
  '1-4': {
    containerClass: 'grid grid-cols-2 grid-rows-4 gap-1',
    paneClasses: { 0: 'row-span-4 col-span-1' },
  },
  '4-1': {
    containerClass: 'grid grid-cols-2 grid-rows-4 gap-1',
    paneClasses: { 4: 'row-span-4 col-span-1' },
  },
  '2-3': {
    containerClass: 'grid grid-cols-6 grid-rows-2 gap-1',
    paneClasses: {
      0: 'col-span-3 row-span-1',
      1: 'col-span-3 row-span-1',
      2: 'col-span-2 row-span-1',
      3: 'col-span-2 row-span-1',
      4: 'col-span-2 row-span-1',
    },
  },
  '3-2': {
    containerClass: 'grid grid-cols-6 grid-rows-2 gap-1',
    paneClasses: {
      0: 'col-span-2 row-span-1',
      1: 'col-span-2 row-span-1',
      2: 'col-span-2 row-span-1',
      3: 'col-span-3 row-span-1',
      4: 'col-span-3 row-span-1',
    },
  },
  '4-1-h': {
    containerClass: 'grid grid-cols-4 grid-rows-2 gap-1',
    paneClasses: { 4: 'col-span-4 row-span-1' },
  },
  '1-3-1': {
    containerClass: 'grid grid-cols-3 grid-rows-3 gap-1',
    paneClasses: { 0: 'row-span-3 col-span-1', 4: 'row-span-3 col-span-1' },
  },
  '2-1-2': {
    containerClass: 'grid grid-cols-3 grid-rows-2 gap-1',
    paneClasses: { 2: 'row-span-2 col-span-1' },
  },

  // 6 Panes
  '6': { containerClass: 'grid grid-cols-3 grid-rows-2 gap-1' },
  '6v': { containerClass: 'grid grid-cols-6 grid-rows-1 gap-1' },
  '6h': { containerClass: 'grid grid-cols-1 grid-rows-6 gap-1' },
  '6c': { containerClass: 'grid grid-cols-2 grid-rows-3 gap-1' },
  '1-5': {
    containerClass: 'grid grid-cols-5 grid-rows-2 gap-1',
    paneClasses: { 0: 'col-span-5 row-span-1' },
  },
  '5-1': {
    containerClass: 'grid grid-cols-5 grid-rows-2 gap-1',
    paneClasses: { 5: 'col-span-5 row-span-1' },
  },

  // 7 Panes
  '1-6': {
    containerClass: 'grid grid-cols-6 grid-rows-2 gap-1',
    paneClasses: { 0: 'col-span-6 row-span-1' },
  },
  '7v': { containerClass: 'grid grid-cols-7 grid-rows-1 gap-1' },
  '1-2-4': {
    containerClass: 'grid grid-cols-3 grid-rows-4 gap-1',
    paneClasses: { 0: 'row-span-4 col-span-1', 1: 'row-span-2 col-span-1', 2: 'row-span-2 col-span-1' },
  },

  // 8 Panes
  '8': { containerClass: 'grid grid-cols-4 grid-rows-2 gap-1' },
  '8c': { containerClass: 'grid grid-cols-2 grid-rows-4 gap-1' },
  '8v': { containerClass: 'grid grid-cols-8 grid-rows-1 gap-1' },
  '8h': { containerClass: 'grid grid-cols-1 grid-rows-8 gap-1' },
};

export function getGridContainerClass(layoutId: ChartLayoutId): string {
  return LAYOUT_GRID_CONFIGS[layoutId]?.containerClass ?? 'grid grid-cols-2 grid-rows-2 gap-1';
}

export function getPaneGridClass(layoutId: ChartLayoutId, index: number): string {
  return LAYOUT_GRID_CONFIGS[layoutId]?.paneClasses?.[index] ?? '';
}

export interface PaneChromeConfig {
  hideLeftToolbar: boolean;
  hideTimeframesToolbar: boolean;
}

/**
 * Derives which toolbars should be hidden for a given pane in a split-chart layout:
 * - `hideLeftToolbar`: true for secondary panes not on the leftmost edge, to prevent duplicate drawing sidebars.
 * - `hideTimeframesToolbar`: true for panes that do not reach the bottom of the grid, preserving vertical space.
 */
export function getPaneChromeConfig(layoutId: ChartLayoutId, index: number): PaneChromeConfig {
  if (layoutId === '1') {
    return { hideLeftToolbar: false, hideTimeframesToolbar: false };
  }

  const hideLeftToolbar = index > 0;

  let hideTimeframesToolbar = false;
  switch (layoutId) {
    case '2h':
      hideTimeframesToolbar = index === 0;
      break;
    case '3h':
      hideTimeframesToolbar = index < 2;
      break;
    case '1-2':
      hideTimeframesToolbar = index === 1;
      break;
    case '2-1':
      hideTimeframesToolbar = index === 0;
      break;
    case '3s':
      hideTimeframesToolbar = index === 0;
      break;
    case '3r':
      hideTimeframesToolbar = index === 0 || index === 1;
      break;
    case '4':
      hideTimeframesToolbar = index === 0 || index === 1;
      break;
    case '4h':
      hideTimeframesToolbar = index < 3;
      break;
    case '1-3':
      hideTimeframesToolbar = index === 1 || index === 2;
      break;
    case '3-1':
      hideTimeframesToolbar = index === 0 || index === 1;
      break;
    case '1-3-h':
    case '3-1-h':
    case '2-2-l':
    case '2-2-r':
    case '2-2-h':
      hideTimeframesToolbar = index === 0 || index === 1;
      break;
    default:
      if (layoutId.includes('h') || layoutId === '6' || layoutId === '6c' || layoutId === '8' || layoutId === '8c') {
        hideTimeframesToolbar = index < (layoutId.startsWith('8') ? 4 : 3);
      }
      break;
  }

  return { hideLeftToolbar, hideTimeframesToolbar };
}


