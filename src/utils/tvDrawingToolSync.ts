// Feature: multi-chart-tool-sync
//
// Synchronizes drawing tools across split-chart panes so that selecting a
// tool on the primary drawing toolbar (leftmost pane) applies it to whichever
// pane is currently active.

import type { IChartingLibraryWidget } from '../charting/datafeedTypes';
import { useChartUIStore } from '../store/useChartUIStore';

const widgetRegistry = new Map<string, IChartingLibraryWidget>();
let currentLineTool: string = 'cursor';
let isBroadcasting = false;

export function registerChartWidget(paneId: string, widget: IChartingLibraryWidget): void {
  widgetRegistry.set(paneId, widget);
  if (currentLineTool && currentLineTool !== 'cursor') {
    try {
      (widget.activeChart() as any)?.selectLineTool?.(currentLineTool);
    } catch {
      // Ignore if chart is not yet fully ready
    }
  }
}

export function unregisterChartWidget(paneId: string): void {
  widgetRegistry.delete(paneId);
}

export function getChartWidget(paneId: string): IChartingLibraryWidget | undefined {
  return widgetRegistry.get(paneId);
}

export function getCurrentLineTool(): string {
  return currentLineTool;
}

/**
 * Called when a tool is selected on any widget's drawing toolbar.
 * Synchronizes the selected tool to the currently active pane.
 */
export function handleLineToolChange(sourceWidget: IChartingLibraryWidget): void {
  if (isBroadcasting) return;
  try {
    const chart = sourceWidget.activeChart() as any;
    if (!chart || typeof chart.selectedLineTool !== 'function') return;

    const tool = chart.selectedLineTool();
    if (!tool || tool === currentLineTool) return;

    currentLineTool = tool;
    const activePaneId = useChartUIStore.getState().activePaneId;
    const targetWidget = widgetRegistry.get(activePaneId);

    if (targetWidget && targetWidget !== sourceWidget) {
      isBroadcasting = true;
      try {
        (targetWidget.activeChart() as any)?.selectLineTool?.(tool);
      } finally {
        isBroadcasting = false;
      }
    }
  } catch {
    // Suppress chart tear-down or transition errors
  }
}

/**
 * Called when a pane becomes active to apply the currently selected drawing tool.
 */
export function syncToolToPane(paneId: string): void {
  if (!currentLineTool || currentLineTool === 'cursor') return;
  const targetWidget = widgetRegistry.get(paneId);
  if (!targetWidget) return;

  try {
    (targetWidget.activeChart() as any)?.selectLineTool?.(currentLineTool);
  } catch {
    // Suppress if widget is not ready
  }
}

