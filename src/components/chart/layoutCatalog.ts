import type { ChartLayoutId, LayoutDefinition } from '../../types/chartLayout';

export const LAYOUT_CATALOG: LayoutDefinition[] = [
  // Row 1 (1 Chart)
  { id: '1', name: 'Single Chart', paneCount: 1, row: 1 },

  // Row 2 (2 Charts)
  { id: '2v', name: '2 Columns', paneCount: 2, row: 2 },
  { id: '2h', name: '2 Rows', paneCount: 2, row: 2 },

  // Row 3 (3 Charts)
  { id: '3v', name: '3 Columns', paneCount: 3, row: 3 },
  { id: '3h', name: '3 Rows', paneCount: 3, row: 3 },
  { id: '1-2', name: '1 Left, 2 Right', paneCount: 3, row: 3 },
  { id: '2-1', name: '2 Left, 1 Right', paneCount: 3, row: 3 },
  { id: '3s', name: '1 Top, 2 Bottom', paneCount: 3, row: 3 },
  { id: '3r', name: '2 Top, 1 Bottom', paneCount: 3, row: 3 },

  // Row 4 (4 Charts)
  { id: '4', name: 'Grid 2x2', paneCount: 4, row: 4 },
  { id: '4h', name: '4 Rows', paneCount: 4, row: 4 },
  { id: '4v', name: '4 Columns', paneCount: 4, row: 4 },
  { id: '1-3', name: '1 Left, 3 Right', paneCount: 4, row: 4 },
  { id: '3-1', name: '3 Left, 1 Right', paneCount: 4, row: 4 },
  { id: '1-3-h', name: '1 Top, 3 Bottom', paneCount: 4, row: 4 },
  { id: '3-1-h', name: '3 Top, 1 Bottom', paneCount: 4, row: 4 },
  { id: '2-2-l', name: '1 Left, 2 Center, 1 Right', paneCount: 4, row: 4 },
  { id: '2-2-r', name: '2 Left, 2 Right', paneCount: 4, row: 4 },
  { id: '2-2-h', name: '2 Top, 2 Bottom', paneCount: 4, row: 4 },

  // Row 5 (5 Charts)
  { id: '1-4-h', name: '1 Top, 4 Bottom', paneCount: 5, row: 5 },
  { id: '5v', name: '5 Columns', paneCount: 5, row: 5 },
  { id: '5h', name: '5 Rows', paneCount: 5, row: 5 },
  { id: '1-4', name: '1 Left, 4 Right', paneCount: 5, row: 5 },
  { id: '4-1', name: '4 Left, 1 Right', paneCount: 5, row: 5 },
  { id: '2-3', name: '2 Top, 3 Bottom', paneCount: 5, row: 5 },
  { id: '3-2', name: '3 Top, 2 Bottom', paneCount: 5, row: 5 },
  { id: '4-1-h', name: '4 Top, 1 Bottom', paneCount: 5, row: 5 },
  { id: '1-3-1', name: '1 Left, 3 Center, 1 Right', paneCount: 5, row: 5 },
  { id: '2-1-2', name: '2 Left, 1 Center, 2 Right', paneCount: 5, row: 5 },

  // Row 6 (6 Charts)
  { id: '6', name: 'Grid 2x3', paneCount: 6, row: 6 },
  { id: '6v', name: '6 Columns', paneCount: 6, row: 6 },
  { id: '6h', name: '6 Rows', paneCount: 6, row: 6 },
  { id: '6c', name: 'Grid 3x2', paneCount: 6, row: 6 },
  { id: '1-5', name: '1 Top, 5 Bottom', paneCount: 6, row: 6 },
  { id: '5-1', name: '5 Top, 1 Bottom', paneCount: 6, row: 6 },

  // Row 7 (7 Charts)
  { id: '1-6', name: '1 Top, 6 Bottom', paneCount: 7, row: 7 },
  { id: '7v', name: '7 Columns', paneCount: 7, row: 7 },
  { id: '1-2-4', name: '1 Left, 2 Center, 4 Right', paneCount: 7, row: 7 },

  // Row 8 (8 Charts)
  { id: '8', name: 'Grid 2x4', paneCount: 8, row: 8 },
  { id: '8c', name: 'Grid 4x2', paneCount: 8, row: 8 },
  { id: '8v', name: '8 Columns', paneCount: 8, row: 8 },
  { id: '8h', name: '8 Rows', paneCount: 8, row: 8 },
];

export const LAYOUT_ROWS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function getLayoutsForRow(row: number): LayoutDefinition[] {
  return LAYOUT_CATALOG.filter((l) => l.row === row);
}

export function getLayoutDefinition(id: ChartLayoutId): LayoutDefinition {
  return LAYOUT_CATALOG.find((l) => l.id === id) ?? LAYOUT_CATALOG[0];
}
