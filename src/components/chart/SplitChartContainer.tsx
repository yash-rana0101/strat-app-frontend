'use client';

// Feature: terminal-ux-overhaul (Task 5.2)
//
// SplitChartContainer — the multi-pane chart layout (Requirement 4).
//
// Renders the Split_Chart_View with ONE full header across the top
// (`SplitChartHeader`) while only the chart portion below is split into
// independent `ChartPane`s. Uses `react-resizable-panels` for 2-pane
// vertical split and CSS grid for other configurations.

import React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import ChartPane from './ChartPane';
import SplitChartHeader from './SplitChartHeader';
import { useChartUIStore } from '../../store/useChartUIStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { TradeProfile } from '../../store/useTradeStore';
import { getGridContainerClass, getPaneGridClass, getPaneChromeConfig } from './layoutGridStyles';

/** The workspace profiles in which the Split_Chart_View is available (R4.7). */
export type SplitEnabledProfile = Extract<TradeProfile, 'INTRADAY' | 'FNO'>;

interface SplitChartContainerProps {
  /** The active workspace mode hosting the split view ('INTRADAY' | 'FNO'). */
  mode: SplitEnabledProfile;
}

/**
 * Multi-pane split chart container supporting 1 to 8 charts.
 * Features ONE full header across the top while splitting only the chart portion below.
 */
export default function SplitChartContainer({ mode }: SplitChartContainerProps) {
  const panes = useChartUIStore((s) => s.panes);
  const activeLayout = useChartUIStore((s) => s.activeLayout);
  const isMobile = useIsMobile();

  // Exactly two panes with vertical split (or default): retain resizable panels
  if ((activeLayout === '2v' || !activeLayout) && panes.length === 2) {
    const [paneA, paneB] = panes;
    const chromeA = getPaneChromeConfig('2v', 0);
    const chromeB = getPaneChromeConfig('2v', 1);

    return (
      <div data-split-mode={mode} className="relative flex h-full w-full min-h-0 flex-col bg-chart-bg">
        {/* One full header across the top */}
        <SplitChartHeader />

        {/* Split chart portion below */}
        <div className="relative flex-1 min-h-0 w-full">
          <Group orientation={isMobile ? 'vertical' : 'horizontal'} className="h-full w-full min-h-0">
            <Panel defaultSize={50} minSize={20}>
              <ChartPane
                key={paneA.id}
                pane={paneA}
                isSplitPane={true}
                hideLeftToolbar={chromeA.hideLeftToolbar}
                hideTimeframesToolbar={chromeA.hideTimeframesToolbar}
              />
            </Panel>
            <Separator
              className={
                isMobile
                  ? 'h-px cursor-row-resize bg-border-default transition-colors hover:bg-emerald-500/40 data-[separator]:h-1'
                  : 'w-px cursor-col-resize bg-border-default transition-colors hover:bg-emerald-500/40 data-[separator]:w-1'
              }
            />
            <Panel defaultSize={50} minSize={20}>
              <ChartPane
                key={paneB.id}
                pane={paneB}
                isSplitPane={true}
                hideLeftToolbar={chromeB.hideLeftToolbar}
                hideTimeframesToolbar={chromeB.hideTimeframesToolbar}
              />
            </Panel>
          </Group>
        </div>
      </div>
    );
  }

  // Multi-pane layouts (3 to 8 panes, or horizontal split '2h')
  const containerClass = getGridContainerClass(activeLayout);

  return (
    <div data-split-mode={mode} className="relative flex h-full w-full min-h-0 flex-col bg-chart-bg">
      {/* One full header across the top */}
      <SplitChartHeader />

      {/* Split chart portion below */}
      <div className="relative flex-1 min-h-0 w-full p-0.5">
        <div className={`h-full w-full min-h-0 ${containerClass}`}>
          {panes.map((pane, idx) => {
            const paneClass = getPaneGridClass(activeLayout, idx);
            const chrome = getPaneChromeConfig(activeLayout, idx);
            return (
              <div key={pane.id} className={`h-full w-full min-h-0 overflow-hidden ${paneClass}`}>
                <ChartPane
                  pane={pane}
                  isSplitPane={true}
                  hideLeftToolbar={chrome.hideLeftToolbar}
                  hideTimeframesToolbar={chrome.hideTimeframesToolbar}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
